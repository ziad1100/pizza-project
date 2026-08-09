import type { Request, Response } from 'express';
import * as reviewsRepo from '../db/reviews';
import * as productsRepo from '../db/products';
import { apiErrorFromPg } from '../db';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthRequest } from '../middlewares/auth';

export const listByProduct = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const result = await reviewsRepo.listByProduct(req.params.productId, page, limit);
  res.json(new ApiResponse(200, { ...result, page, limit }));
});

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const isApproved = req.query.isApproved;
  const result = await reviewsRepo.adminList(
    page,
    limit,
    q,
    isApproved === 'true' || isApproved === 'false' ? String(isApproved) : '',
  );
  res.json(new ApiResponse(200, { ...result, page, limit }));
});

export const adminRemove = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!(await reviewsRepo.adminRemove(req.params.id))) throw new ApiError(404, 'Review not found');
    res.json(new ApiResponse(200, null, 'Review deleted'));
  } catch (err) {
    throw apiErrorFromPg(err);
  }
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { product: productId, rating, comment } = req.body;
  const product = await productsRepo.exists(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  try {
    const review = await reviewsRepo.create(req.user!.id, productId, rating, comment ?? '');
    res.status(201).json(new ApiResponse(201, review, 'Review submitted'));
  } catch (err) {
    throw apiErrorFromPg(err);
  }
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    if (!(await reviewsRepo.remove(req.params.id, req.user!.id))) throw new ApiError(404, 'Review not found');
    res.json(new ApiResponse(200, null, 'Review deleted'));
  } catch (err) {
    throw apiErrorFromPg(err);
  }
});

export const moderate = asyncHandler(async (req: Request, res: Response) => {
  const { isApproved } = req.body;
  const review = await reviewsRepo.moderate(req.params.id, Boolean(isApproved));
  if (!review) throw new ApiError(404, 'Review not found');
  res.json(new ApiResponse(200, review));
});