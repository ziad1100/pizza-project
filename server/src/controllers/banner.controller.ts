import type { Request, Response } from 'express';
import Banner from '../models/Banner';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const active = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find({ isActive: true }).sort('order').lean();
  res.json(new ApiResponse(200, banners));
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find().sort('order').lean();
  res.json(new ApiResponse(200, banners));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.create(req.body);
  res.status(201).json(new ApiResponse(201, banner, 'Banner created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!banner) throw new ApiError(404, 'Banner not found');
  res.json(new ApiResponse(200, banner, 'Banner updated'));
});

export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found');
  banner.isActive = !banner.isActive;
  await banner.save();
  res.json(new ApiResponse(200, banner));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found');
  res.json(new ApiResponse(200, null, 'Banner deleted'));
});