import type { Request, Response } from 'express';
import Post from '../models/Post';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const listPublished = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 9;
  const [items, total] = await Promise.all([
    Post.find({ isPublished: true }).sort('-publishedAt').skip((page - 1) * limit).limit(limit).lean(),
    Post.countDocuments({ isPublished: true }),
  ]);
  res.json(new ApiResponse(200, { items, total, page, pages: Math.ceil(total / limit) }));
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findOne({ slug: req.params.slug, isPublished: true }).lean();
  if (!post) throw new ApiError(404, 'Post not found');
  res.json(new ApiResponse(200, post));
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const filter = q
    ? {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { titleEn: { $regex: q, $options: 'i' } },
          { slug: { $regex: q, $options: 'i' } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    Post.find(filter).sort('-publishedAt').skip((page - 1) * limit).limit(limit).lean(),
    Post.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, { items, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit }));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.create({ ...req.body, slug: req.body.slug || req.body.titleEn || req.body.title });
  res.status(201).json(new ApiResponse(201, post, 'Post created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!post) throw new ApiError(404, 'Post not found');
  res.json(new ApiResponse(200, post, 'Post updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');
  res.json(new ApiResponse(200, null, 'Post deleted'));
});