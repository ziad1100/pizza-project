import type { Request, Response } from 'express';
import Coupon from '../models/Coupon';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { validateCoupon } from '../services/coupon.service';
import type { AuthRequest } from '../middlewares/auth';

export const validate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, subtotal } = req.body;
  const result = await validateCoupon(code, req.user!.id, Number(subtotal) || 0);
  res.json(new ApiResponse(200, result, 'Coupon applied'));
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await Coupon.find().sort('-createdAt').lean();
  res.json(new ApiResponse(200, coupons));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(new ApiResponse(201, coupon, 'Coupon created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json(new ApiResponse(200, coupon, 'Coupon updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json(new ApiResponse(200, null, 'Coupon deleted'));
});