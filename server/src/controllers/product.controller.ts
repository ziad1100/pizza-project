import type { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { slugifyText } from '../utils/slugify';
import Review from '../models/Review';

interface ListQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string; // sub category id
  section?: string; // section id
  tags?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  isBestSeller?: string;
  isOffer?: string;
}

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListQuery;
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(q.limit) || 12));
  const filter: Record<string, unknown> = { isAvailable: true };

  if (q.search) {
    filter.$or = [
      { name: { $regex: q.search, $options: 'i' } },
      { nameEn: { $regex: q.search, $options: 'i' } },
      { description: { $regex: q.search, $options: 'i' } },
      { ingredients: { $in: [new RegExp(q.search, 'i')] } },
      { tags: { $in: [new RegExp(q.search, 'i')] } },
    ];
  }
  if (q.category) filter.category = q.category;
  if (q.section) {
    const subIds = (await Category.find({ type: 'sub', parentId: q.section }).select('_id').lean()).map((c) => c._id);
    filter.category = { $in: subIds };
  }
  if (q.tags) {
    const tags = q.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length) filter.tags = { $in: tags };
  }
  if (q.minPrice || q.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (q.minPrice) priceFilter.$gte = Number(q.minPrice);
    if (q.maxPrice) priceFilter.$lte = Number(q.maxPrice);
    filter.basePrice = priceFilter;
  }
  if (q.minRating) filter.rating = { $gte: Number(q.minRating) };
  if (q.isBestSeller === 'true') filter.isBestSeller = true;
  if (q.isOffer === 'true') filter.isOffer = true;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
    rating: { rating: -1 },
    bestseller: { isBestSeller: -1, rating: -1 },
  };
  const sort = sortMap[q.sort ?? 'bestseller'] ?? sortMap.bestseller;

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(200, {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    }),
  );
});

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const q = String(req.query.q || '');
  const availability = String(req.query.availability || '');
  const category = String(req.query.category || '');
  const filter: Record<string, unknown> = {};
  if (availability === 'available') filter.isAvailable = true;
  if (availability === 'hidden') filter.isAvailable = false;
  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { nameEn: { $regex: q, $options: 'i' } },
    ];
  }
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name nameEn')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, { items, total, page, pages: Math.ceil(total / limit), limit }));
});

export const getBestSellers = asyncHandler(async (req: Request, res: Response) => {
  const items = await Product.find({ isAvailable: true, isBestSeller: true })
    .sort({ rating: -1, createdAt: -1 })
    .limit(10)
    .lean();
  res.json(new ApiResponse(200, items));
});

export const getOffers = asyncHandler(async (req: Request, res: Response) => {
  const items = await Product.find({ isAvailable: true, isOffer: true })
    .sort({ discount: -1, createdAt: -1 })
    .limit(10)
    .lean();
  res.json(new ApiResponse(200, items));
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ slug: req.params.slug, isAvailable: true }).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  const reviews = await Review.find({ product: product._id, isApproved: true })
    .populate('user', 'fullName avatar')
    .sort('-createdAt')
    .limit(20)
    .lean();
  res.json(new ApiResponse(200, { ...product, reviews }));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(new ApiResponse(200, product));
});

export const toggleProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.isAvailable = !product.isAvailable;
  await product.save();
  res.json(new ApiResponse(200, product));
});

const TEXT_FIELDS = ['name', 'nameEn', 'description', 'descriptionEn'] as const;
const ARRAY_FIELDS = ['ingredients', 'ingredientsEn', 'tags'] as const;

const sanitizeBody = (body: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const f of TEXT_FIELDS) if (body[f] !== undefined) clean[f] = body[f];
  for (const f of ARRAY_FIELDS) {
    if (body[f] !== undefined) clean[f] = Array.isArray(body[f]) ? body[f] : String(body[f]).split(',').map((s) => s.trim());
  }
  if (body.category) clean.category = body.category;
  if (body.images !== undefined) clean.images = body.images;
  if (body.sizes !== undefined) clean.sizes = body.sizes;
  if (body.extras !== undefined) clean.extras = body.extras;
  for (const f of ['basePrice', 'discount', 'preparationTime', 'calories'] as const) {
    if (body[f] !== undefined) clean[f] = Number(body[f]);
  }
  for (const f of ['isAvailable', 'isBestSeller', 'isOffer'] as const) {
    if (body[f] !== undefined) clean[f] = Boolean(body[f]);
  }
  return clean;
};

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = sanitizeBody(req.body);
  if (!body.name) throw new ApiError(400, 'Product name is required');
  const slug = slugifyText((body.nameEn as string) || (body.name as string));
  body.slug = `${slug}-${Date.now().toString(36)}`;
  const product = await Product.create(body);
  res.status(201).json(new ApiResponse(201, product, 'Product created'));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = sanitizeBody(req.body);
  const product = await Product.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true }).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(new ApiResponse(200, product, 'Product updated'));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(new ApiResponse(200, null, 'Product deleted'));
});