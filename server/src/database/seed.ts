import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from './connection';
import { ensureRolePermissions } from './roleSync';
import { applyMigrations } from './migrate';
import * as usersRepo from '../db/users';
import * as categoriesRepo from '../db/categories';
import * as productsRepo from '../db/products';
import * as couponsRepo from '../db/coupons';
import * as offersRepo from '../db/offers';
import * as bannersRepo from '../db/banners';
import * as branchesRepo from '../db/branches';
import * as deliveryZonesRepo from '../db/deliveryZones';
import * as postsRepo from '../db/posts';
import * as cartsRepo from '../db/carts';
import { upsertSetting } from '../db/settings';
import { query, row } from '../db';
import { DEFAULT_SETTINGS, ORDER_STATUS } from '../constants';
import { seedSections, seedExtras, bestSellerNames, offerNames, type SeedItem, type SeedSub } from './seedData';

const slugifyEn = (text: string): string =>
  slugify(text, { lower: true, strict: true }) || `item-${Date.now().toString(36)}`;

// Real dish photos live in public/images/products. The URL is derived from the
// product's English name + its sub-section (e.g. "Chicken BBQ" in "Chicken" ->
// /images/products/chicken-bbq-chicken.jpg). We hard-fail when a photo is
// missing so products can never silently lose their images again.
const PUBLIC_PRODUCTS_DIR = fileURLToPath(new URL('../../../public/images/products', import.meta.url));

const imageFor = (item: SeedItem, sub: SeedSub): string => {
  const url = item.image ?? `/images/products/${slugifyEn(item.en)}-${slugifyEn(sub.en)}.jpg`;
  const file = path.basename(url);
  if (!fs.existsSync(path.join(PUBLIC_PRODUCTS_DIR, file))) {
    throw new Error(`[seed] missing product image for "${item.en}" (sub: ${sub.en}): expected public/images/products/${file}`);
  }
  return url;
};

const clearTables = async (): Promise<void> => {
  await query(
    `TRUNCATE TABLE
       order_items, coupon_redemptions, cart_items, wishlist_items, offer_products,
       product_sizes, product_extras, reviews, orders, carts, wishlists, offers,
       coupons, banners, branches, delivery_zones, posts, contacts, newsletters,
       notifications, categories, products, activity_logs, analytics, permissions,
       roles, users, settings
     RESTART IDENTITY CASCADE`,
  );
};

const seedUsers = async (): Promise<Record<string, string>> => {
  const password = await bcrypt.hash('Pizza123!', 10);
  const users = [
    { fullName: 'مدير النظام', email: 'admin@pizzahouse.dev', role: 'admin', phone: '01000000001', isVerified: true },
    { fullName: 'Manager', email: 'manager@pizzahouse.dev', role: 'manager', phone: '01000000002', isVerified: true },
    { fullName: 'Employee', email: 'employee@pizzahouse.dev', role: 'employee', phone: '01000000003', isVerified: true },
    { fullName: 'أحمد محمد', email: 'customer@pizzahouse.dev', role: 'customer', phone: '01000000004', isVerified: true },
  ];
  const ids: Record<string, string> = {};
  for (const u of users) {
    const created = await usersRepo.create({ ...u, passwordHash: password, provider: 'local' });
    ids[u.role] = created.id;
  }
  console.log('[seed] users created (password: Pizza123!)');
  return ids;
};

const seedCategories = async (): Promise<Record<string, Record<string, string>>> => {
  const map: Record<string, Record<string, string>> = {};
  for (const section of seedSections) {
    const sectionDoc = await categoriesRepo.create({
      name: section.ar,
      nameEn: section.en,
      slug: `section-${slugifyEn(section.en)}`,
      type: 'section',
      icon: section.icon,
      order: Object.keys(map).length,
      isActive: true,
    });
    if (!sectionDoc) throw new Error('[seed] failed to create section category');
    const subMap: Record<string, string> = {};
    for (const sub of section.subs) {
      const subDoc = await categoriesRepo.create({
        name: sub.ar,
        nameEn: sub.en,
        slug: `sub-${slugifyEn(section.en)}-${slugifyEn(sub.en)}`,
        type: 'sub',
        parentId: sectionDoc._id as string,
        order: Object.keys(subMap).length,
        isActive: true,
      });
      if (!subDoc) throw new Error('[seed] failed to create sub category');
      subMap[sub.ar] = String(subDoc._id);
    }
    map[section.ar] = subMap;
  }
  console.log('[seed] categories created');
  return map;
};

const buildSizes = (prices: [number | null, number | null, number | null]) => {
  const names = ['صغير', 'وسط', 'كبير'];
  const enNames = ['Small', 'Medium', 'Large'];
  const active = prices
    .map((p, i) => (p !== null ? { name: names[i], nameEn: enNames[i], price: p as number } : null))
    .filter(Boolean) as { name: string; nameEn: string; price: number }[];
  if (active.length === 1) {
    return [{ name: 'حجم واحد', nameEn: 'Regular', price: active[0].price }];
  }
  return active;
};

const seedProducts = async (catMap: Record<string, Record<string, string>>): Promise<void> => {
  let bestCounter = 0;
  const usedSlugs = new Set<string>();
  const descFor = (itemAr: string, itemEn: string): [string, string] => [
    `${itemAr} - مكونات طازجة 100%`,
    `${itemEn} - 100% fresh ingredients`,
  ];
  for (const section of seedSections) {
    for (const sub of section.subs) {
      const categoryId = catMap[section.ar]?.[sub.ar];
      for (const item of sub.items) {
        const base = `${slugifyEn(item.en)}-${slugifyEn(sub.en)}-${slugifyEn(section.en)}`;
        let slug = base;
        let n = 2;
        while (usedSlugs.has(slug)) {
          slug = `${base}-${n}`;
          n += 1;
        }
        usedSlugs.add(slug);
        const sizes = buildSizes(item.prices);
        const basePrice = Math.min(...sizes.map((s) => s.price));
        const isBestSeller = bestSellerNames.includes(item.ar) && bestCounter < 15;
        if (isBestSeller) bestCounter += 1;
        const isOffer = offerNames.includes(item.ar);
        const discount = isOffer ? 15 + (bestCounter % 4) * 5 : 0;
        const [description, descriptionEn] = descFor(item.ar, item.en);
        await productsRepo.create({
          name: item.ar,
          nameEn: item.en,
          slug,
          description,
          descriptionEn,
          category: categoryId,
          images: [imageFor(item, sub)],
          sizes,
          extras: seedExtras.map((e) => ({ name: e.ar, nameEn: e.en, price: e.price })),
          ingredients: item.ingredients ?? [],
          basePrice,
          preparationTime: 20,
          calories: Math.round(600 + Math.random() * 400),
          isBestSeller,
          isOffer,
          discount,
          tags: item.tags,
          isAvailable: true,
        });
      }
    }
  }
  console.log('[seed] products created');
};

const slugToId = async (slug: string): Promise<string | null> => {
  const p = await productsRepo.getBySlug(slug);
  return p ? String(p._id) : null;
};

const idsForSlugs = async (slugs: string[]): Promise<string[]> => {
  const ids = await Promise.all(slugs.map(slugToId));
  return ids.filter((id): id is string => Boolean(id));
};

const seedCommerce = async (): Promise<void> => {
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000);

  for (const c of [
    { code: 'WELCOME20', type: 'percent', value: 20, minOrder: 150, maxDiscount: 100, maxUses: 1000, endDate: inDays(365) },
    { code: 'PIZZA10', type: 'percent', value: 10, minOrder: 100, endDate: inDays(90) },
    { code: 'SAVE30', type: 'fixed', value: 30, minOrder: 250, endDate: inDays(30) },
  ]) {
    await couponsRepo.create(c);
  }

  const offers: Array<Record<string, unknown>> = [
    {
      title: 'أوفير الأسبوع',
      titleEn: 'Weekend Special',
      description: 'قبضة عرابي: حواوشي + كريب + طاجن',
      descriptionEn: 'Orabi pick: hawawshi + crepe + tagine',
      discountType: 'fixed',
      discountValue: 50,
      startDate: now,
      endDate: inDays(30),
      products: await idsForSlugs([
        'meat-hawawshi-hawawshi-hawawshi',
        'bbq-chicken-crepe-chicken-crepe-crepe',
        'legend-mix-crepe-mix-crepe-crepe',
        'meat-tagine-tagine-tagine-and-delivery',
        'chicken-fajita-crepe-chicken-crepe-crepe',
      ]),
      theme: 'red',
      isActive: true,
    },
    {
      title: 'خصم على الحلو',
      titleEn: 'Sweet Crepe Deal',
      description: 'خصم 20% على الكريب الحلو قبل 6 مساءً',
      descriptionEn: 'Get 20% OFF sweet crepes ordered before 6PM',
      discountType: 'percent',
      discountValue: 20,
      startDate: now,
      endDate: inDays(30),
      products: await idsForSlugs([
        'chocolate-crepe-sweet-crepe-sweet-crepe',
        'chocolate-banana-crepe-sweet-crepe-sweet-crepe',
        'chocolate-oreo-crepe-sweet-crepe-sweet-crepe',
        'lotus-crepe-sweet-crepe-sweet-crepe',
        'custard-dessert-dessert',
      ]),
      theme: 'dark',
      isActive: true,
    },
    {
      title: 'عرض العائلة',
      titleEn: 'Family Deal',
      description: 'باكيت بطاطس + باستا + حواوشي + طاجن',
      descriptionEn: 'Potato bag + pasta + hawawshi + tagine',
      discountType: 'fixed',
      discountValue: 40,
      startDate: now,
      endDate: inDays(30),
      products: await idsForSlugs([
        'potato-bag-appetizers-starters',
        'chicken-pasta-pasta-pasta',
        'sausage-hawawshi-hawawshi-hawawshi',
        'meat-mozzarella-tagine-tagine-tagine-and-delivery',
        'cheddar-potato-appetizers-starters',
      ]),
      theme: 'gold',
      isActive: true,
    },
  ];
  for (const offer of offers) {
    await offersRepo.create(offer as never);
  }

  for (const banner of [
    { title: 'أفضل كريب وباستا في مدينتك', subtitle: '68 صنفًا من الكريب والباستا والحواوشي', buttonText: 'عرض المنيو', buttonLink: '/menu', position: 'hero', order: 1, isActive: true },
    { title: 'جوعان؟ اطلب الآن', subtitle: 'عروض يومية على الكريب والطواجن والحلو', buttonText: 'اطلب الآن', buttonLink: '/menu', position: 'home', order: 2, isActive: true },
  ]) {
    await bannersRepo.create(banner);
  }

  await branchesRepo.create({
    name: 'مطعم عرابي',
    nameEn: 'ORABI Restaurant',
    address: 'شبين القناطر، أمام كوبري المركز، بجوار المستشفى المركزي',
    addressEn: 'Shubin Al Qanater, in front of Kobri Al Markaz, near Al Mustashfa Al Markazy',
    phone: '01278767679',
    whatsapp: '01278767679',
    workHours: 'يومياً 10 صباحاً - 3 صباحاً',
    workHoursEn: 'Daily 10AM - 3AM',
    isActive: true,
  });

  await deliveryZonesRepo.create({ name: 'داخل النطاق', nameEn: 'Main zone', fee: 25, minOrder: 100, estimatedMinutes: 30 });
  await deliveryZonesRepo.create({ name: 'النطاق الممتد', nameEn: 'Extended zone', fee: 40, minOrder: 150, estimatedMinutes: 45 });

  for (const post of [
    {
      title: 'أسرار عجينة الكريب الذهبية',
      titleEn: 'The secret of the golden crepe dough',
      slug: 'authentic-crepe-dough',
      excerpt: 'قرمشة من الخارج ونعومة من الداخل',
      excerptEn: 'Crisp outside, soft inside',
      content: 'نخفق عجيننا الطازج كل يوم ونتركه يرتاح دقائق قبل فرده على الجريل الساخن، لنخرج كريباً ذهبياً مقرمشاً من الأطراف وطرياً من الداخل يحمل كل الحشوات التي تختارها — من الشاورما والباربيكيو إلى الشيكولاتة والأوريو.',
      contentEn: 'We whip our fresh batter daily and let it rest before spreading it on the hot grill, for a golden crepe crisp at the edges and soft at heart — ready for any filling, from shawarma and BBQ to chocolate and oreo.',
      image: '/images/blog/dough.jpg',
      tags: ['كريب'],
      isPublished: true,
    },
    {
      title: 'لماذا كريب الحلو؟',
      titleEn: 'Why our Sweet Crepes?',
      slug: 'sweet-crepe-heritage',
      excerpt: 'حلوى عرابي المميزة بعد كل وجبة',
      excerptEn: 'A sweet Orabi finish to every meal',
      content: 'كريب الحلو عندنا تحلية قائمة بذاتها: شيكولاتة غنية، موز طازج، أوريو مطحون، وصوص لوتس الكريمي — كلها ملفوفة في كريب ذهبي مفروش للتو. جرّبها مع كوب شاي بعد حواوشي أو طاجن ساخن.',
      contentEn: 'Our sweet crepe is a dessert of its own: rich chocolate, fresh banana, crushed oreo and creamy lotus sauce — all folded into a golden freshly-spread crepe. Pair it with tea after a hawawshi or a hot tagine.',
      image: '/images/blog/feteer.jpg',
      tags: ['كريب حلو', 'حلو'],
      isPublished: true,
    },
  ]) {
    await postsRepo.create(post);
  }

  console.log('[seed] commerce data created');
};

const seedSettings = async (): Promise<void> => {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await upsertSetting(key, value);
  }
  console.log('[seed] settings created');
};

const seedReviews = async (userIds: Record<string, string>): Promise<void> => {
  const products = await query<{ id: string }>(
    'SELECT id FROM products ORDER BY "createdAt" LIMIT 12',
  );
  const comments = [
    'أحلى وجبات في المنطقة، الطعم رائع!',
    'الفراخ المقرمشة ولا أروع، دائمًا طازجة',
    'البيتزا من عجينة طازجة والصوص لذيذ',
    'توصيل سريع والطلب لسه سخن',
    'جودة ممتازة وأسعار مناسبة',
    'الأحجام كبيرة والطعم أصلي 100%',
  ];
  for (const [i, product] of products.entries()) {
    const rating = 4 + (i % 2);
    await query(
      `INSERT INTO reviews ("userId", "productId", "reviewType", rating, comment, status, "isVerifiedPurchase")
       VALUES ($1::uuid, $2::uuid, 'meal', $3, $4, 'published', false)`,
      [userIds.customer, product.id, rating, comments[i % comments.length]],
    );
    await query(
      `UPDATE products SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews
         WHERE "productId" = $1 AND "reviewType" = 'meal' AND status = 'published'), 0),
       "reviewsCount" = (SELECT count(*) FROM reviews
         WHERE "productId" = $1 AND "reviewType" = 'meal' AND status = 'published')
       WHERE id = $1::uuid`,
      [product.id],
    );
  }

  const experience = [
    { rating: 5, foodQuality: 5, delivery: 5, packaging: 4, service: 5, overall: 5, comment: 'تجربة رائعة من أول الطلب للتوصيل، الأكل كان سخن والطعم ممتاز.' },
    { rating: 4, foodQuality: 4, delivery: 5, packaging: 4, service: 4, overall: 4, comment: 'التوصيل سريع والتغليف محكم، الأطباق كانت طازجة ولذيذة.' },
  ];
  for (const r of experience) {
    await query(
      `INSERT INTO reviews ("userId", "reviewType", rating, comment, status, "isVerifiedPurchase",
         "foodQuality", delivery, packaging, service, "overall")
       VALUES ($1::uuid, 'restaurant', $2, $3, 'published', false, $4, $5, $6, $7, $8)`,
      [userIds.customer, r.rating, r.comment, r.foodQuality, r.delivery, r.packaging, r.service, r.overall],
    );
  }
  console.log('[seed] reviews created');
};

const seedCart = async (userIds: Record<string, string>): Promise<void> => {
  const wanted = [
    { nameEn: 'Chicken', qty: 2 },
    { nameEn: 'BBQ Chicken Crepe', qty: 1 },
    { nameEn: 'Chocolate Crepe', qty: 1 },
  ];
  for (const w of wanted) {
    const rows = await query<{ id: string; basePrice: string }>(
      `SELECT id, "basePrice" FROM products WHERE "nameEn" = $1 AND "isAvailable" = true ORDER BY "createdAt" LIMIT 1`,
      [w.nameEn],
    );
    const product = rows[0];
    if (product) {
      await cartsRepo.addItem(userIds.customer, {
        product: product.id,
        size: null,
        sizeName: '',
        extras: [],
        qty: w.qty,
        unitPrice: Number(product.basePrice),
      });
    }
  }
  console.log('[seed] cart seeded for customer demo account');
};

const ensureSchema = async (): Promise<void> => {
  const table = await row<{ t: string | null }>(`SELECT to_regclass('public.products')::text AS t`);
  if (!table?.t) await applyMigrations();
};

const isSeeded = async (): Promise<boolean> => {
  const counts = await row<{ n: string }>(`SELECT count(*)::int::text AS n FROM products`);
  return Number(counts?.n ?? 0) > 0;
};

// Idempotent repair: backfill an empty offer banner from the first image of the
// offer's first linked product. Runs on every seed invocation (even when the DB
// is already seeded) so admin-created offers without banners heal themselves
// without a destructive SEED_RESET wipe.
const repairOfferBanners = async (): Promise<void> => {
  const repaired = await query<{ id: string }>(
    `UPDATE offers o
        SET banner = sub.url
       FROM (
         SELECT op."offerId", p.images[1] AS url
           FROM offer_products op
           JOIN products p ON p.id = op."productId"
          WHERE p.images IS NOT NULL
            AND array_length(p.images, 1) > 0
            AND p.images[1] <> ''
       ) sub
      WHERE sub."offerId" = o.id
        AND (o.banner IS NULL OR o.banner = '')
      RETURNING o.id`,
  );
  if (repaired.length > 0) console.log(`[seed] offer banners backfilled (${repaired.length})`);
};

const run = async (): Promise<void> => {
  console.log('[seed] connecting...');
  await connectDB();
  await ensureSchema();
  await repairOfferBanners();
  if ((await isSeeded()) && process.env.SEED_RESET !== '1') {
    console.log('[seed] data already exists — skipping (set SEED_RESET=1 to wipe and reseed)');
    await disconnectDB();
    return;
  }
  await ensureRolePermissions();
  await clearTables();
  const userIds = await seedUsers();
  const catMap = await seedCategories();
  await seedProducts(catMap);
  await seedCommerce();
  await repairOfferBanners();
  await seedSettings();
  await seedReviews(userIds);
  await seedCart(userIds);

  const counts = await query<{ products: string; categories: string; users: string }>(
    `SELECT (SELECT count(*) FROM products)::int::text AS products,
            (SELECT count(*) FROM categories)::int::text AS categories,
            (SELECT count(*) FROM users)::int::text AS users`,
  );
  console.log('[seed] DONE', counts[0], `(orders statuses: ${Object.values(ORDER_STATUS).join(', ')})`);
  await disconnectDB();
};

run().catch(async (err) => {
  console.error('[seed] FAILED', err);
  await disconnectDB();
  process.exit(1);
});
