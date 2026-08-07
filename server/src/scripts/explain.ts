import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import env from '../config/env';
import Product from '../models/Product';
import Category from '../models/Category';
import Order from '../models/Order';
import Review from '../models/Review';

let memServer: MongoMemoryServer | null = null;

interface QueryProbe {
  name: string;
  run: () => Promise<unknown>;
}

interface Ctx {
  categoryId: string;
  slug: string;
  productId: string;
  userId: string;
  searchTerm: string;
}

const connect = async (): Promise<string> => {
  if (env.mongoUri) {
    await mongoose.connect(env.mongoUri);
    return env.mongoUri;
  }
  const { MongoMemoryServer: MMS } = await import('mongodb-memory-server');
  memServer = await MMS.create();
  await mongoose.connect(memServer.getUri());
  return memServer.getUri();
};

const explain = (label: string, cursor: { explain: (v: string) => Promise<unknown> }): Promise<void> =>
  cursor
    .explain('executionStats')
    .then((plan) => {
      const stats = (plan as { executionStats?: { nReturned?: number; totalKeysExamined?: number; totalDocsExamined?: number; executionTimeMillis?: number; executionStages?: { stage?: string } } }).executionStats;
      const stage = stats?.executionStages?.stage ?? 'n/a';
      console.log(
        `[explain] ${label.padEnd(38)} stage=${String(stage).padEnd(16)} returned=${String(stats?.nReturned ?? '?').padEnd(4)} keysEx=${String(stats?.totalKeysExamined ?? '?').padEnd(5)} docsEx=${String(stats?.totalDocsExamined ?? '?').padEnd(5)} time=${stats?.executionTimeMillis ?? -1}ms`,
      );
      return undefined;
    })
    .catch((err) => console.log(`[explain] ${label}: ERROR ${String(err)}`));

const probes = (ctx: Ctx): QueryProbe[] => [
  {
    name: 'product list (available, default bestseller sort)',
    run: () =>
      explain('products:list', Product.find({ isAvailable: true }).sort({ isBestSeller: -1, rating: -1 }).skip(0).limit(12)),
  },
  {
    name: 'product by slug',
    run: () => explain('product:bySlug', Product.findOne({ slug: ctx.slug, isAvailable: true })),
  },
  {
    name: 'products by category',
    run: () => explain('products:byCategory', Product.find({ isAvailable: true, category: ctx.categoryId }).limit(12).sort({ createdAt: -1 })),
  },
  {
    name: 'products best sellers',
    run: () => explain('products:bestsellers', Product.find({ isAvailable: true, isBestSeller: true }).sort({ rating: -1 }).limit(10)),
  },
  {
    name: 'products offers',
    run: () => explain('products:offers', Product.find({ isAvailable: true, isOffer: true }).sort({ discount: -1 }).limit(10)),
  },
  {
    name: 'product search regex',
    run: () => explain('products:search', Product.find({ isAvailable: true, $or: [{ name: { $regex: ctx.searchTerm, $options: 'i' } }, { nameEn: { $regex: ctx.searchTerm, $options: 'i' } }, { description: { $regex: ctx.searchTerm, $options: 'i' } }, { ingredients: { $in: [new RegExp(ctx.searchTerm, 'i')] } }, { tags: { $in: [new RegExp(ctx.searchTerm, 'i')] } }] }).limit(12)),
  },
  {
    name: 'order history by user',
    run: () => explain('orders:byUser', Order.find({ user: ctx.userId }).sort({ createdAt: -1 })),
  },
  {
    name: 'reviews by product',
    run: () => explain('reviews:byProduct', Review.find({ product: ctx.productId }).sort({ createdAt: -1 })),
  },
  {
    name: 'categories active',
    run: () => explain('categories:active', Category.find({ isActive: true }).sort({ order: 1 })),
  },
];

const main = async (): Promise<void> => {
  const uri = await connect();
  console.log(`[explain] connected to ${uri.split('@').pop()?.split('/')[0] ?? 'local'}`);

  const product = await Product.findOne().lean();
  const category = product ? await Category.findById(product.category).lean() : null;
  const user = await mongoose.connection.db?.collection('users').findOne({});
  const ctx: Ctx = {
    categoryId: category?._id?.toString() ?? (await Category.findOne().lean())?._id?.toString() ?? '000000000000000000000000',
    slug: product?.slug ?? '',
    productId: product?._id?.toString() ?? '000000000000000000000000',
    userId: user?._id?.toString() ?? '000000000000000000000000',
    searchTerm: 'chicken',
  };
  console.log(`[explain] ctx: category=${ctx.categoryId} slug=${ctx.slug} product=${ctx.productId} user=${ctx.userId}`);

  await Promise.all(probes(ctx).map((p) => p.run()));
  await mongoose.disconnect();
  if (memServer) await memServer.stop();
  console.log('[explain] done');
};

void main();