import { beforeEach, describe, expect, it } from 'vitest';
import Category from '../../models/Category';
import Product from '../../models/Product';
import Review from '../../models/Review';
import { api, bearer, createUser, seedRoles, toId } from '../helpers';

const PRODUCTS = '/api/v1/products';
const REVIEWS = '/api/v1/reviews';

const setupCatalog = async () => {
  const section = await Category.create({ name: 'بيتزا', nameEn: 'Pizza', slug: 'pizza-section', type: 'section', isActive: true });
  const sub = await Category.create({ name: 'كلاسيك', nameEn: 'Classic', slug: 'classic', type: 'sub', parentId: section._id, isActive: true });
  const pepperoni = await Product.create({
    name: 'بيبروني',
    nameEn: 'Pepperoni',
    slug: 'pepperoni',
    category: sub._id,
    basePrice: 120,
    isAvailable: true,
  });
  const margherita = await Product.create({
    name: 'مارغريتا',
    nameEn: 'Margherita',
    slug: 'margherita',
    category: sub._id,
    basePrice: 90,
    isAvailable: true,
  });
  const hidden = await Product.create({
    name: 'مخفي',
    nameEn: 'Hidden',
    slug: 'hidden-pizza',
    category: sub._id,
    basePrice: 200,
    isAvailable: false,
  });
  const best = await Product.create({
    name: 'الأكثر مبيعاً',
    nameEn: 'Best Seller',
    slug: 'best-seller',
    category: sub._id,
    basePrice: 150,
    isAvailable: true,
    isBestSeller: true,
    rating: 5,
  });
  const offer = await Product.create({
    name: 'عرض اليوم',
    nameEn: 'Daily Offer',
    slug: 'daily-offer',
    category: sub._id,
    basePrice: 100,
    isAvailable: true,
    isOffer: true,
    discount: 20,
  });
  return { section, sub, pepperoni, margherita, hidden, best, offer };
};

describe('public product catalog', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('lists paginated products (unavailable ones excluded)', async () => {
    const { pepperoni } = await setupCatalog();
    void pepperoni;
    const res = await api.get(`${PRODUCTS}?limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.total).toBe(4);
    expect(res.body.data.pages).toBe(2);
  });

  it('never exposes unavailable products in public lists', async () => {
    await setupCatalog();
    const res = await api.get(PRODUCTS);
    expect(res.body.data.items.every((p: { isAvailable: boolean }) => p.isAvailable)).toBe(true);
  });

  it('filters by search term', async () => {
    const { pepperoni } = await setupCatalog();
    void pepperoni;
    const res = await api.get(`${PRODUCTS}?search=pepperoni`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].slug).toBe('pepperoni');
  });

  it('filters by category', async () => {
    const { sub } = await setupCatalog();
    const res = await api.get(`${PRODUCTS}?category=${toId(sub._id)}`);
    expect(res.body.data.total).toBe(4);
  });

  it('returns a product by slug with approved reviews', async () => {
    const { pepperoni } = await setupCatalog();
    const res = await api.get(`${PRODUCTS}/pepperoni`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('بيبروني');
    expect(res.body.data.reviews).toEqual([]);
    expect(res.body.data._id).toBe(toId(pepperoni._id));
  });

  it('returns best sellers (available only, best-seller flagged)', async () => {
    await setupCatalog();
    const res = await api.get(`${PRODUCTS}/best-sellers`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('best-seller');
    expect(res.body.data[0].isAvailable).toBe(true);
  });

  it('returns offers (available only, offer flagged)', async () => {
    await setupCatalog();
    const res = await api.get(`${PRODUCTS}/offers`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('daily-offer');
    expect(res.body.data[0].discount).toBe(20);
  });

  it('returns 404 for unknown or unavailable slugs', async () => {
    await setupCatalog();
    expect((await api.get(`${PRODUCTS}/nope`)).status).toBe(404);
    expect((await api.get(`${PRODUCTS}/hidden-pizza`)).status).toBe(404);
  });
});

describe('categories', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('builds a section->sub tree', async () => {
    const { sub } = await setupCatalog();
    const res = await api.get('/api/v1/categories/tree');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].children).toHaveLength(1);
    expect(String(res.body.data[0].children[0]._id)).toBe(toId(sub._id));
  });

  it('lists categories (all flag includes inactive)', async () => {
    await setupCatalog();
    const all = await api.get('/api/v1/categories?all=true');
    expect(all.body.data.length).toBe(2);
  });
});

describe('reviews', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('requires authentication to submit', async () => {
    const { pepperoni } = await setupCatalog();
    const res = await api.post(REVIEWS).send({ product: toId(pepperoni._id), rating: 5 });
    expect(res.status).toBe(401);
  });

  it('validates the rating range', async () => {
    const { pepperoni } = await setupCatalog();
    const user = await createUser();
    const res = await api.post(REVIEWS).set(bearer(toId(user._id))).send({ product: toId(pepperoni._id), rating: 9 });
    expect(res.status).toBe(422);
  });

  it('submits a review and updates product rating stats', async () => {
    const { pepperoni } = await setupCatalog();
    const user = await createUser();
    const res = await api.post(REVIEWS).set(bearer(toId(user._id))).send({ product: toId(pepperoni._id), rating: 5, comment: 'ممتازة' });
    expect(res.status).toBe(201);
    const product = await Product.findById(pepperoni._id).lean();
    expect(product?.rating).toBe(5);
    expect(product?.reviewsCount).toBe(1);
  });

  it('updates the existing review instead of duplicating', async () => {
    const { pepperoni } = await setupCatalog();
    const user = await createUser();
    const auth = bearer(toId(user._id));
    await api.post(REVIEWS).set(auth).send({ product: toId(pepperoni._id), rating: 5 });
    await api.post(REVIEWS).set(auth).send({ product: toId(pepperoni._id), rating: 3 });
    const count = await Review.countDocuments({ user: user._id });
    expect(count).toBe(1);
    const product = await Product.findById(pepperoni._id).lean();
    expect(product?.rating).toBe(3);
  });

  it('honors moderation on the public product page', async () => {
    const { pepperoni } = await setupCatalog();
    const customer = await createUser();
    const admin = await createUser({ role: 'admin' });
    const created = await api.post(REVIEWS).set(bearer(toId(customer._id))).send({ product: toId(pepperoni._id), rating: 4 });
    const reviewId = created.body.data._id;
    expect((await api.get(`${PRODUCTS}/pepperoni`)).body.data.reviews).toHaveLength(1);
    const unapproved = await api.patch(`${REVIEWS}/${reviewId}/moderate`).set(bearer(toId(admin._id))).send({ isApproved: false });
    expect(unapproved.status).toBe(200);
    expect((await api.get(`${PRODUCTS}/pepperoni`)).body.data.reviews).toHaveLength(0);
    await api.patch(`${REVIEWS}/${reviewId}/moderate`).set(bearer(toId(admin._id))).send({ isApproved: true });
    expect((await api.get(`${PRODUCTS}/pepperoni`)).body.data.reviews).toHaveLength(1);
  });

  it('lets an admin list and remove reviews', async () => {
    const { pepperoni } = await setupCatalog();
    const customer = await createUser();
    const admin = await createUser({ role: 'admin' });
    const created = await api.post(REVIEWS).set(bearer(toId(customer._id))).send({ product: toId(pepperoni._id), rating: 4 });
    const list = await api.get(`${REVIEWS}/admin`).set(bearer(toId(admin._id)));
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);
    const removed = await api.delete(`${REVIEWS}/admin/${created.body.data._id}`).set(bearer(toId(admin._id)));
    expect(removed.status).toBe(200);
    expect((await api.get(`${PRODUCTS}/pepperoni`)).body.data.reviews).toHaveLength(0);
  });

  it('lets a customer delete their own review', async () => {
    const { pepperoni } = await setupCatalog();
    const customer = await createUser();
    const created = await api.post(REVIEWS).set(bearer(toId(customer._id))).send({ product: toId(pepperoni._id), rating: 4 });
    const res = await api.delete(`${REVIEWS}/${created.body.data._id}`).set(bearer(toId(customer._id)));
    expect(res.status).toBe(200);
    expect(await Review.countDocuments()).toBe(0);
  });
});