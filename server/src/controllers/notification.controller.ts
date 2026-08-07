import type { Request, Response } from 'express';
import Notification from '../models/Notification';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthRequest } from '../middlewares/auth';

export const getForUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({
    $or: [{ user: req.user!.id }, { audience: 'all' }, { audience: 'role', role: req.user!.role }],
  })
    .sort('-createdAt')
    .limit(50)
    .lean();
  res.json(new ApiResponse(200, notifications));
});

export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, $or: [{ user: req.user!.id }, { audience: 'all' }] },
    { isRead: true },
    { new: true },
  ).lean();
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json(new ApiResponse(200, notification));
});

export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ user: req.user!.id, isRead: false }, { isRead: true });
  res.json(new ApiResponse(200, null, 'All marked as read'));
});

export const sendToUsers = asyncHandler(async (req: Request, res: Response) => {
  const { userIds, title, titleEn, body, bodyEn, type, link } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) throw new ApiError(400, 'userIds are required');
  await Notification.insertMany(
    userIds.map((user) => ({ user, title, titleEn, body, bodyEn, type, link })),
  );
  res.status(201).json(new ApiResponse(201, null, 'Notifications sent'));
});