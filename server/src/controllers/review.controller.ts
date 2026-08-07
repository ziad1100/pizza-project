import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Review from '../models/Review';
import Product from '../models/Product';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthRequest } from '../middlewares/auth';

export const listByProduct = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  const filter = { product: req.params.productId, isApproved: true };
  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'fullName avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, { items, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit }));
});

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const isApproved = req.query.isApproved;

  const filter: Record<string, unknown> = {};
  if (isApproved === 'true' || isApproved === 'false') filter.isApproved = isApproved === 'true';

  if (q) {
    const productIds = await Product.find({ name: { $regex: q, $options: 'i' } }).distinct('_id');
    if (productIds.length === 0) {
      res.json(new ApiResponse(200, { items: [], total: 0, page, pages: 1, limit }));
      return;
    }
    filter.product = { $in: productIds };
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'fullName avatar email')
      .populate('product', 'name nameEn images')
      .lean(),
    Review.countDocuments(filter),
  ]);
  res.json(
    new ApiResponse(200, { items, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit }),
  );
});

export const adminRemove = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  res.json(new ApiResponse(200, null, 'Review deleted'));
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { product: productId, rating, comment } = req.body;
  const product = await Product.exists({ _id: productId });
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await Review.findOne({ user: req.user!.id, product: productId });
  let review: InstanceType<typeof Review>;
  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
    review = await existing.save();
  } else {
    review = await Review.create({ user: req.user!.id, product: productId, rating, comment });
  }

  const stats = await Review.aggregate([
    { $match: { product: new Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    {
      rating: Math.round((stats[0]?.avg ?? rating) * 10) / 10,
      reviewsCount: stats[0]?.count ?? 1,
    },
  );
  res.status(201).json(new ApiResponse(201, review, 'Review submitted'));
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  if (!review) throw new ApiError(404, 'Review not found');
  res.json(new ApiResponse(200, null, 'Review deleted'));
});

export const moderate = asyncHandler(async (req: Request, res: Response) => {
  const { isApproved } = req.body;
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved }, { new: true }).lean();
  if (!review) throw new ApiError(404, 'Review not found');
  res.json(new ApiResponse(200, review));
});