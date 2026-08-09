import { beforeEach, describe, expect, it } from 'vitest';
import * as categoriesRepo from '../../db/categories';
import * as couponsRepo from '../../db/coupons';
import * as productsRepo from '../../db/products';
import * as settingsRepo from '../../db/settings';
import { query, rowCount } from '../../db';
import { api, bearer, createUser, seedRoles, toId } from '../helpers';

const ORDERS = '/api/v1/orders';

const setupCatalog = async () => {
  const category = await categoriesRepo.create({ name: 'بيتزا', nameEn: 'Pizza', slug: 'pizza', type: 'section', isActive: true });
  const product = await productsRepo.create({
    name: 'بيبروني',
    nameEn: 'Pepperoni',
    slug: 'pepperoni',
    category: toId(category._id),
    basePrice: 120,
    sizes: [{ name: 'كبير', nameEn: 'Large', price: 150 }],
    extras: [{ name: 'جبنة إضافية', nameEn: 'Extra cheese', price: 10 }],
    isAvailable: true,
  });
  return { category, product };
};

const orderBody = (productId: string, extra: Record<string, unknown> = {}) => ({
  items: [{ product: productId, qty: 1 }],
  address: { city: 'Cairo', area: 'Maadi', street: 'Main', building: '5' },
  phone: '01000000000',
  customerName: 'Test Customer',
  ...extra,
});

const createCoupon = (overrides: Record<string, unknown> = {}) =>
  couponsRepo.create({
    code: 'SAVE10',
    name: 'Save 10',
    type: 'percent',
    value: 10,
    minOrder: 0,
    maxDiscount: 0,
    startDate: new Date(Date.now() - 1000),
    isActive: true,
    ...overrides,
  });

describe('create order', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('requires authentication', async () => {
    const { product } = await setupCatalog();
    const res = await api.post(ORDERS).send(orderBody(toId(product._id)));
    expect(res.status).toBe(401);
  });

  it('rejects an empty items array with 422', async () => {
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(user.id)).send({ ...orderBody('x'), items: [] });
    expect(res.status).toBe(422);
  });

  it('rejects a missing phone/address with 422', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(user.id)).send({ items: [{ product: toId(product._id), qty: 1 }] });
    expect(res.status).toBe(422);
  });

  it('rejects an order below the minimum order', async () => {
    const category = await categoriesRepo.create({ name: 'Pizza', slug: 'pizza-min', type: 'section' });
    const cheap = await productsRepo.create({ name: 'Slice', slug: 'slice', category: toId(category._id), basePrice: 40, isAvailable: true });
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(user.id)).send(orderBody(toId(cheap._id)));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Minimum order');
  });

  it('creates a pending order with delivery fee and total', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(user.id)).send(orderBody(toId(product._id)));
    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.orderNo).toMatch(/^PH-/);
    expect(order.status).toBe('pending');
    expect(order.subtotal).toBe(120);
    expect(order.deliveryFee).toBe(25);
    expect(order.total).toBe(145);
    expect(order.payment.method).toBe('cash');
    expect(order.items[0].name).toBe('بيبروني');
  });

  it('uses the selected size price', async () => {
    const { product } = await setupCatalog();
    const sizes = await productsRepo.getByIdAdmin(toId(product._id));
    const sizeId = toId((sizes?.sizes as Array<{ _id: string }>)[0]._id);
    const user = await createUser();
    const res = await api
      .post(ORDERS)
      .set(bearer(user.id))
      .send(orderBody(toId(product._id), { items: [{ product: toId(product._id), size: sizeId, qty: 1 }] }));
    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(150);
    expect(res.body.data.items[0].size).toBe('كبير');
  });

  it('adds extras to the line total', async () => {
    const { product } = await setupCatalog();
    const admin = await productsRepo.getByIdAdmin(toId(product._id));
    const extra = (admin?.extras as Array<{ name: string; price: number }>)[0];
    const user = await createUser();
    const res = await api
      .post(ORDERS)
      .set(bearer(user.id))
      .send(
        orderBody(toId(product._id), {
          items: [{ product: toId(product._id), qty: 2, extras: [{ name: extra.name, price: extra.price }] }],
        }),
      );
    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(260);
  });

  it('applies a percent coupon discount', async () => {
    const { product } = await setupCatalog();
    await createCoupon();
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(user.id)).send(orderBody(toId(product._id), { couponCode: 'save10' }));
    expect(res.status).toBe(201);
    expect(res.body.data.discount).toBe(12);
    expect(res.body.data.total).toBe(133);
    expect(res.body.data.couponCode).toBe('SAVE10');
  });

  it('applies a fixed coupon discount', async () => {
    const { product } = await setupCatalog();
    await createCoupon({ type: 'fixed', value: 50 });
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(user.id)).send(orderBody(toId(product._id), { couponCode: 'SAVE10' }));
    expect(res.status).toBe(201);
    expect(res.body.data.discount).toBe(50);
    expect(res.body.data.total).toBe(95);
  });

  it('rejects an invalid coupon code', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(user.id)).send(orderBody(toId(product._id), { couponCode: 'BOGUS' }));
    expect(res.status).toBe(404);
  });

  it('waives the delivery fee above the free-delivery threshold', async () => {
    const { product } = await setupCatalog();
    await settingsRepo.upsertSetting('freeDeliveryOver', 100);
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(user.id)).send(orderBody(toId(product._id)));
    expect(res.status).toBe(201);
    expect(res.body.data.deliveryFee).toBe(0);
    expect(res.body.data.total).toBe(120);
  });

  it('increments daily analytics', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    await api.post(ORDERS).set(bearer(user.id)).send(orderBody(toId(product._id)));
    const today = new Date().toISOString().slice(0, 10);
    const rows = await query<Record<string, unknown>>('SELECT * FROM analytics WHERE "date" = $1', [today]);
    const stats = rows[0];
    expect(stats).toMatchObject({ orders: 1 });
    expect(Number(stats?.revenue)).toBe(145);
  });
});

describe('order cancellation', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('cancels only pending orders of the owner', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    const created = await api.post(ORDERS).set(bearer(user.id)).send(orderBody(toId(product._id)));
    const id = created.body.data._id;
    const cancel = await api.post(`${ORDERS}/${id}/cancel`).set(bearer(user.id));
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('cancelled');
    const again = await api.post(`${ORDERS}/${id}/cancel`).set(bearer(user.id));
    expect(again.status).toBe(400);
  });

  it('cannot cancel another users order', async () => {
    const { product } = await setupCatalog();
    const owner = await createUser();
    const stranger = await createUser();
    const created = await api.post(ORDERS).set(bearer(owner.id)).send(orderBody(toId(product._id)));
    const res = await api.post(`${ORDERS}/${created.body.data._id}/cancel`).set(bearer(stranger.id));
    expect(res.status).toBe(404);
  });
});

describe('order status updates', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  const createPendingOrder = async () => {
    const { product } = await setupCatalog();
    const customer = await createUser();
    const created = await api.post(ORDERS).set(bearer(customer.id)).send(orderBody(toId(product._id)));
    return { order: created.body.data, customer };
  };

  it('advances the status and notifies the customer', async () => {
    const admin = await createUser({ role: 'admin' });
    const { order, customer } = await createPendingOrder();
    const res = await api
      .patch(`${ORDERS}/${order._id}/status`)
      .set(bearer(admin.id))
      .send({ status: 'preparing' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('preparing');
    expect(res.body.data.statusHistory).toHaveLength(2);
    const rows = await query(`SELECT * FROM notifications WHERE "userId" = $1 LIMIT 1`, [customer.id]);
    const note = rows[0];
    expect(note).toBeDefined();
    expect(String(note?.link)).toContain(order._id);
  });

  it('rejects an invalid status', async () => {
    const admin = await createUser({ role: 'admin' });
    const { order } = await createPendingOrder();
    const res = await api.patch(`${ORDERS}/${order._id}/status`).set(bearer(admin.id)).send({ status: 'teleported' });
    expect(res.status).toBe(400);
  });
});

describe('history & stats', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('returns only the current users orders', async () => {
    const { product } = await setupCatalog();
    const alice = await createUser({ email: 'alice@pizzahouse.test' });
    const bob = await createUser({ email: 'bob@pizzahouse.test' });
    await api.post(ORDERS).set(bearer(alice.id)).send(orderBody(toId(product._id)));
    await api.post(ORDERS).set(bearer(bob.id)).send(orderBody(toId(product._id)));
    const res = await api.get(`${ORDERS}/history`).set(bearer(alice.id));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    const dbCount = await rowCount(`SELECT count(*)::int AS n FROM orders WHERE "userId" = $1`, [alice.id]);
    expect(dbCount).toBe(1);
  });

  it('exposes revenue stats to staff roles', async () => {
    const { product } = await setupCatalog();
    const customer = await createUser();
    await api.post(ORDERS).set(bearer(customer.id)).send(orderBody(toId(product._id)));
    const manager = await createUser({ role: 'manager' });
    const res = await api.get(`${ORDERS}/stats`).set(bearer(manager.id));
    expect(res.status).toBe(200);
    expect(res.body.data.totalOrders).toBe(1);
    expect(res.body.data.revenue).toBe(145);
  });
});