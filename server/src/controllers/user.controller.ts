import type { Response } from 'express';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthRequest } from '../middlewares/auth';

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = String(req.query.search || '');
  const role = String(req.query.role || '');
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-refreshToken')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, { items: users, total, page, pages: Math.ceil(total / limit) }));
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const allowed = ['fullName', 'phone', 'role', 'isActive', 'avatar'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, user));
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, null, 'User deleted'));
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).lean();
  res.json(new ApiResponse(200, user));
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.user!.id;
  const allowed = ['fullName', 'phone', 'avatar', 'addresses'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(id, updates, { new: true }).lean();
  res.json(new ApiResponse(200, user));
});