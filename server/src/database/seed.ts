import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from './connection';
import Role from '../models/Role';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import Offer from '../models/Offer';
import Banner from '../models/Banner';
import Branch from '../models/Branch';
import Cart from '../models/Cart';
import Setting, { upsertSetting } from '../models/Setting';
import Post from '../models/Post';
import DeliveryZone from '../models/DeliveryZone';
import Review from '../models/Review';
import { DEFAULT_SETTINGS, ORDER_STATUS, PERMISSION_PRESETS } from '../constants';
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

const clearCollections = async (): Promise<void> => {
  await Promise.all([
    Role.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Offer.deleteMany({}),
    Banner.deleteMany({}),
    Branch.deleteMany({}),
    Cart.deleteMany({}),
    Setting.deleteMany({}),
    Post.deleteMany({}),
    DeliveryZone.deleteMany({}),
    Review.deleteMany({}),
  ]);
};

const seedRoles = async (): Promise<void> => {
  const roleDefs = [
    { name: 'مدير النظام', nameEn: 'Admin', slug: 'admin', description: 'Full access' },
    { name: 'مدير', nameEn: 'Manager', slug: 'manager', description: 'Manage content & orders' },
    { name: 'موظف', nameEn: 'Employee', slug: 'employee', description: 'Orders & reviews' },
    { name: 'عميل', nameEn: 'Customer', slug: 'customer', description: 'Customer account' },
  ];
  for (const r of roleDefs) {
    await Role.create({
      name: r.nameEn,
      slug: r.slug,
      description: r.description,
      permissions: PERMISSION_PRESETS[r.slug as keyof typeof PERMISSION_PRESETS],
    });
  }
   
  console.log('[seed] roles created');
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
    const created = await User.create({ ...u, password, provider: 'local' });
    ids[u.role] = String(created._id);
  }
   
  console.log('[seed] users created (password: Pizza123!)');
  return ids;
};

const seedCategories = async (): Promise<Record<string, Record<string, string>>> => {
  const map: Record<string, Record<string, string>> = {};
  for (const section of seedSections) {
    const sectionDoc = await Category.create({
      name: section.ar,
      nameEn: section.en,
      slug: `section-${slugifyEn(section.en)}`,
      type: 'section',
      icon: section.icon,
      order: Object.keys(map).length,
      isActive: true,
    });
    const subMap: Record<string, string> = {};
    for (const sub of section.subs) {
      const subDoc = await Category.create({
        name: sub.ar,
        nameEn: sub.en,
        slug: `sub-${slugifyEn(section.en)}-${slugifyEn(sub.en)}`,
        type: 'sub',
        parentId: sectionDoc._id,
        order: Object.keys(subMap).length,
        isActive: true,
      });
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
  const active = prices.map((p, i) => (p !== null ? { name: names[i], nameEn: enNames[i], price: p as number } : null)).filter(Boolean) as { name: string; nameEn: string; price: number }[];
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
        await Product.create({
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

const seedCommerce = async (): Promise<void> => {
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000);

  await Coupon.create([
    { code: 'WELCOME20', type: 'percent', value: 20, minOrder: 150, maxDiscount: 100, maxUses: 1000, endDate: inDays(365) },
    { code: 'PIZZA10', type: 'percent', value: 10, minOrder: 100, endDate: inDays(90) },
    { code: 'SAVE30', type: 'fixed', value: 30, minOrder: 250, endDate: inDays(30) },
  ]);

const offerProductIds = async (slugs: string[]): Promise<unknown[]> => {
  const docs = await Product.find({ slug: { $in: slugs } }).select('_id').lean();
  return docs.map((d) => d._id);
};

await Offer.create([
    {
      title: 'أوفير الأسبوع',
      titleEn: 'Weekend Special',
      description: 'بيتزا كبيرة + مشروب',
      descriptionEn: 'Large pizza + drink',
      discountType: 'fixed',
      discountValue: 50,
      startDate: now,
      endDate: inDays(30),
      products: await offerProductIds([
        'margherita-cheese-italian',
        'chicken-chicken-italian',
        'kranshi-chicken-chicken-italian',
        'thawret-orabi-mix-italian',
        'super-supreme-mix-italian',
      ]),
      theme: 'red',
      isActive: true,
    },
    {
      title: 'خصم على الفطير',
      titleEn: 'Feteer Deal',
      description: 'خصم 20% على الأصناف الحلوة قبل 6 مساءً',
      descriptionEn: 'Get 20% OFF sweet feteer ordered before 6PM',
      discountType: 'percent',
      discountValue: 20,
      startDate: now,
      endDate: inDays(30),
      products: await offerProductIds([
        'kunafa-sweet-feteer-sweet-feteer',
        'mixed-sweets-sweet-feteer-sweet-feteer',
        'lotus-sweet-feteer-sweet-feteer',
        'oreo-chocolate-sweet-feteer-sweet-feteer',
        'cream-and-honey-sweet-feteer-sweet-feteer',
        'basbousa-sweet-feteer-sweet-feteer',
        'basbousa-and-cocoa-sweet-feteer-sweet-feteer',
        'beldi-butter-meshaltet-meshaltet-meshaltet',
      ]),
      theme: 'dark',
      isActive: true,
    },
    {
      title: 'عرض العائلة',
      titleEn: 'Family Deal',
      description: '2 بيتزا وسط + فطير حلو + 2 مشروب',
      descriptionEn: '2 medium pizzas + sweet feteer + 2 drinks',
      discountType: 'fixed',
      discountValue: 40,
      startDate: now,
      endDate: inDays(30),
      products: await offerProductIds([
        'chicken-mix-mix-italian',
        'meat-mix-mix-italian',
        'cheese-mix-mix-italian',
        'smoked-sweet-mix-mix-italian',
        'chicken-beef-sausage-mix-italian',
        'chickenpastramimeat-mix-mix-italian',
      ]),
      theme: 'gold',
      isActive: true,
    },
  ]);

  await Banner.create([
    { title: 'أفضل بيتزا وفطير في مدينتك', subtitle: '107 صنفًا من الأصالة الإيطالية والشرقية', buttonText: 'عرض المنيو', buttonLink: '/menu', position: 'hero', order: 1, isActive: true },
    { title: 'جوعان؟ اطلب الآن', subtitle: 'عروض يومية على البيتزا والفطير الحلو', buttonText: 'اطلب الآن', buttonLink: '/menu', position: 'home', order: 2, isActive: true },
  ]);

  await Branch.create([
    {
      name: 'مطعم عرابي',
      nameEn: 'ORABI Restaurant',
      address: '',
      addressEn: '',
      phone: '01070003535',
      whatsapp: '01070003535',
      workHours: 'يومياً 10 صباحاً - 3 صباحاً',
      workHoursEn: 'Daily 10AM - 3AM',
      isActive: true,
    },
  ]);

  await DeliveryZone.create([
    { name: 'داخل النطاق', nameEn: 'Main zone', fee: 25, minOrder: 100, estimatedMinutes: 30 },
    { name: 'النطاق الممتد', nameEn: 'Extended zone', fee: 40, minOrder: 150, estimatedMinutes: 45 },
  ]);

await Post.create([
    {
      title: 'أسرار تحضير العجينة الإيطالية الأصلية',
      titleEn: 'Secrets of the authentic Italian dough',
      slug: 'authentic-italian-dough',
      excerpt: 'تعرف على سر قرمشة عجينة البيتزا',
      excerptEn: 'The secret to our crispy pizza dough',
      content: 'نبدأ بالدقيق الإيطالي الفاخر ونترك العجينة تتخمر 24 ساعة كاملة قبل تشكيلها يدوياً، ثم نضعها على حجر ساخن لتحصل على قشرة مقرمشة من الخارج وطرية من الداخل. في هذه التدوينة نشرح خطوة بخطوة كيف نبني النكهة من العجينة ذاتها.',
      contentEn: 'We start with premium Italian flour and let the dough ferment for a full 24 hours before shaping by hand, then bake it on a hot stone for a crispy rim and a soft center. In this post we walk through how the flavour starts in the dough itself.',
      image: '/images/blog/dough.jpg',
      tags: ['بيتزا', 'عجينة'],
      isPublished: true,
    },
    {
      title: 'لماذا الفطير البلدي؟',
      titleEn: 'Why the Egyptian Feteer?',
      slug: 'why-egyptian-feteer',
      excerpt: 'تراث مصري أصيل في كل طبقة',
      excerptEn: 'Authentic Egyptian heritage in every layer',
      content: 'الفطير البلدي جزء من تراثنا؛ نرقق العجينة بالزبدة عشرات الطبقات لنخرج فطيراً ذهبياً مقرمشاً من الخارج وطرياً من الداخل. يقدم حلواً بالقشطة والعسل والمكسرات، أو مالحاً بالجبن واللحوم والفراخ.',
      contentEn: 'Egyptian feteer is part of our heritage. We roll the dough with local butter into dozens of layers for a golden crispy exterior and an airy soft interior — served sweet with cream, honey and nuts, or savoury with cheese, meat or chicken.',
      image: '/images/blog/feteer.jpg',
      tags: ['فطير', 'تراث'],
      isPublished: true,
    },
  ]);

   
  console.log('[seed] commerce data created');
};

const seedSettings = async (): Promise<void> => {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await upsertSetting(key, value);
  }
   
  console.log('[seed] settings created');
};

const seedReviews = async (userIds: Record<string, string>): Promise<void> => {  const products = await Product.find().limit(12).lean();
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
    await Review.create({
      user: userIds.customer,
      product: product._id,
      rating,
      comment: comments[i % comments.length],
      isApproved: true,
    });
  }
   
  console.log('[seed] reviews created');
};

const seedCart = async (userIds: Record<string, string>): Promise<void> => {
  const wanted = [
    { nameEn: 'Chicken', qty: 2 },
    { nameEn: 'Margherita', qty: 1 },
    { nameEn: 'Chocolate', qty: 1 },
  ];
  const items: { product: unknown; size: null; sizeName: string; extras: unknown[]; qty: number; unitPrice: number }[] = [];
  for (const w of wanted) {
    const product = await Product.findOne({ nameEn: w.nameEn, isAvailable: true }).lean();
    if (product) {
      items.push({
        product: product._id,
        size: null,
        sizeName: '',
        extras: [],
        qty: w.qty,
        unitPrice: product.basePrice,
      });
    }
  }
  if (items.length) {
    await Cart.create({ user: userIds.customer, items, couponCode: '' });
  }
  console.log('[seed] cart seeded for customer demo account');
};

const run = async (): Promise<void> => {
   
  console.log('[seed] connecting...');
  await connectDB();
  await clearCollections();
  await seedRoles();
  const userIds = await seedUsers();
  const catMap = await seedCategories();
  await seedProducts(catMap);
  await seedCommerce();
  await seedSettings();
  await seedReviews(userIds);
  await seedCart(userIds);

  const counts = {
    products: await Product.countDocuments(),
    categories: await Category.countDocuments(),
    users: await User.countDocuments(),
  };
   
  console.log('[seed] DONE', counts, `(orders statuses: ${Object.values(ORDER_STATUS).join(', ')})`);
  await disconnectDB();
};

run().catch(async (err) => {
   
  console.error('[seed] FAILED', err);
  await disconnectDB();
  process.exit(1);
});
