import type { Request, Response } from 'express';
import Newsletter from '../models/Newsletter';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');
  const existing = await Newsletter.findOne({ email });
  if (existing) {
    if (!existing.isSubscribed) {
      existing.isSubscribed = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
    }
    res.json(new ApiResponse(200, null, 'You are already subscribed'));
    return;
  }
  await Newsletter.create({ email, name, isSubscribed: true });
  res.status(201).json(new ApiResponse(201, null, 'Subscribed successfully'));
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const doc = await Newsletter.findOneAndUpdate(
    { email },
    { isSubscribed: false, unsubscribedAt: new Date() },
    { new: true },
  );
  res.json(new ApiResponse(200, null, doc ? 'Unsubscribed' : 'Email not found'));
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const subscribers = await Newsletter.find({ isSubscribed: true }).sort('-createdAt').lean();
  res.json(new ApiResponse(200, subscribers));
});