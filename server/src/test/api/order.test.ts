import { beforeEach, describe, expect, it } from 'vitest';
import Analytics from '../../models/Analytics';
import Category from '../../models/Category';
import Coupon from '../../models/Coupon';
import Notification from '../../models/Notification';
import Order from '../../models/Order';
import Product from '../../models/Product';
import Setting from '../../models/Setting';
import { api, bearer, createUser, seedRoles, toId } from '../helpers';

const ORDERS = '/api/v1/orders';

const setupCatalog = async () => {
  const category = await Category.create({ name: 'بيتزا', nameEn: 'Pizza', slug: 'pizza', type: 'section', isActive: true });
  const product = await Product.create({
    name: 'بيبروني',
    nameEn: 'Pepperoni',
    slug: 'pepperoni',
    category: category._id,
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
  Coupon.create({
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
    const res = await api.post(ORDERS).set(bearer(toId(user._id))).send({ ...orderBody('x'), items: [] });
    expect(res.status).toBe(422);
  });

  it('rejects a missing phone/address with 422', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(toId(user._id))).send({ items: [{ product: toId(product._id), qty: 1 }] });
    expect(res.status).toBe(422);
  });

  it('rejects an order below the minimum order', async () => {
    const category = await Category.create({ name: 'Pizza', slug: 'pizza', type: 'section' });
    const cheap = await Product.create({ name: 'Slice', slug: 'slice', category: category._id, basePrice: 40, isAvailable: true });
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(toId(user._id))).send(orderBody(toId(cheap._id)));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Minimum order');
  });

  it('creates a pending order with delivery fee and total', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(toId(user._id))).send(orderBody(toId(product._id)));
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
    const sizeId = toId(product.sizes![0]._id);
    const user = await createUser();
    const res = await api
      .post(ORDERS)
      .set(bearer(toId(user._id)))
      .send(orderBody(toId(product._id), { items: [{ product: toId(product._id), size: sizeId, qty: 1 }] }));
    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(150);
    expect(res.body.data.items[0].size).toBe('كبير');
  });

  it('adds extras to the line total', async () => {
    const { product } = await setupCatalog();
    const extra = product.extras![0];
    const user = await createUser();
    const res = await api
      .post(ORDERS)
      .set(bearer(toId(user._id)))
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
    const res = await api.post(ORDERS).set(bearer(toId(user._id))).send(orderBody(toId(product._id), { couponCode: 'save10' }));
    expect(res.status).toBe(201);
    expect(res.body.data.discount).toBe(12);
    expect(res.body.data.total).toBe(133);
    expect(res.body.data.couponCode).toBe('SAVE10');
  });

  it('applies a fixed coupon discount', async () => {
    const { product } = await setupCatalog();
    await createCoupon({ type: 'fixed', value: 50 });
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(toId(user._id))).send(orderBody(toId(product._id), { couponCode: 'SAVE10' }));
    expect(res.status).toBe(201);
    expect(res.body.data.discount).toBe(50);
    expect(res.body.data.total).toBe(95);
  });

  it('rejects an invalid coupon code', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(toId(user._id))).send(orderBody(toId(product._id), { couponCode: 'BOGUS' }));
    expect(res.status).toBe(404);
  });

  it('waives the delivery fee above the free-delivery threshold', async () => {
    const { product } = await setupCatalog();
    await Setting.create({ key: 'freeDeliveryOver', value: 100 });
    const user = await createUser();
    const res = await api.post(ORDERS).set(bearer(toId(user._id))).send(orderBody(toId(product._id)));
    expect(res.status).toBe(201);
    expect(res.body.data.deliveryFee).toBe(0);
    expect(res.body.data.total).toBe(120);
  });

  it('increments daily analytics', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    await api.post(ORDERS).set(bearer(toId(user._id))).send(orderBody(toId(product._id)));
    const today = new Date().toISOString().slice(0, 10);
    const stats = await Analytics.findOne({ date: today }).lean();
    expect(stats).toMatchObject({ orders: 1 });
    expect(stats!.revenue).toBe(145);
  });
});

describe('order cancellation', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('cancels only pending orders of the owner', async () => {
    const { product } = await setupCatalog();
    const user = await createUser();
    const created = await api.post(ORDERS).set(bearer(toId(user._id))).send(orderBody(toId(product._id)));
    const id = created.body.data._id;
    const cancel = await api.post(`${ORDERS}/${id}/cancel`).set(bearer(toId(user._id)));
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('cancelled');
    const again = await api.post(`${ORDERS}/${id}/cancel`).set(bearer(toId(user._id)));
    expect(again.status).toBe(400);
  });

  it('cannot cancel another users order', async () => {
    const { product } = await setupCatalog();
    const owner = await createUser();
    const stranger = await createUser();
    const created = await api.post(ORDERS).set(bearer(toId(owner._id))).send(orderBody(toId(product._id)));
    const res = await api.post(`${ORDERS}/${created.body.data._id}/cancel`).set(bearer(toId(stranger._id)));
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
    const created = await api.post(ORDERS).set(bearer(toId(customer._id))).send(orderBody(toId(product._id)));
    return { order: created.body.data, customer };
  };

  it('advances the status and notifies the customer', async () => {
    const admin = await createUser({ role: 'admin' });
    const { order, customer } = await createPendingOrder();
    const res = await api
      .patch(`${ORDERS}/${order._id}/status`)
      .set(bearer(toId(admin._id)))
      .send({ status: 'preparing' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('preparing');
    expect(res.body.data.statusHistory).toHaveLength(2);
    const note = await Notification.findOne({ user: customer._id }).lean();
    expect(note).not.toBeNull();
    expect(note!.link).toContain(order._id);
  });

  it('rejects an invalid status', async () => {
    const admin = await createUser({ role: 'admin' });
    const { order } = await createPendingOrder();
    const res = await api.patch(`${ORDERS}/${order._id}/status`).set(bearer(toId(admin._id))).send({ status: 'teleported' });
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
    await api.post(ORDERS).set(bearer(toId(alice._id))).send(orderBody(toId(product._id)));
    await api.post(ORDERS).set(bearer(toId(bob._id))).send(orderBody(toId(product._id)));
    const res = await api.get(`${ORDERS}/history`).set(bearer(toId(alice._id)));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    const dbCount = await Order.countDocuments({ user: alice._id });
    expect(dbCount).toBe(1);
  });

  it('exposes revenue stats to staff roles', async () => {
    const { product } = await setupCatalog();
    const customer = await createUser();
    await api.post(ORDERS).set(bearer(toId(customer._id))).send(orderBody(toId(product._id)));
    const manager = await createUser({ role: 'manager' });
    const res = await api.get(`${ORDERS}/stats`).set(bearer(toId(manager._id)));
    expect(res.status).toBe(200);
    expect(res.body.data.totalOrders).toBe(1);
    expect(res.body.data.revenue).toBe(145);
  });
});