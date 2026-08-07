import type { Request, Response } from 'express';
import Offer from '../models/Offer';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const activeOffers = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .populate('products')
    .sort('-createdAt')
    .lean();
  res.json(new ApiResponse(200, offers));
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const offers = await Offer.find().sort('-createdAt').lean();
  res.json(new ApiResponse(200, offers));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const offer = await Offer.create(req.body);
  res.status(201).json(new ApiResponse(201, offer, 'Offer created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!offer) throw new ApiError(404, 'Offer not found');
  res.json(new ApiResponse(200, offer, 'Offer updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) throw new ApiError(404, 'Offer not found');
  res.json(new ApiResponse(200, null, 'Offer deleted'));
});