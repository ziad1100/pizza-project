import type { Request, Response } from 'express';
import Contact from '../models/Contact';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, email, message } = req.body;
  if (!name || !phone || !message) throw new ApiError(400, 'Name, phone and message are required');
  const contact = await Contact.create({ name, phone, email, message });
  res.status(201).json(new ApiResponse(201, contact, 'Message sent'));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const [items, total] = await Promise.all([
    Contact.find().sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
    Contact.countDocuments(),
  ]);
  res.json(new ApiResponse(200, { items, total, page, pages: Math.ceil(total / limit) }));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true }).lean();
  if (!contact) throw new ApiError(404, 'Message not found');
  res.json(new ApiResponse(200, contact));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) throw new ApiError(404, 'Message not found');
  res.json(new ApiResponse(200, null, 'Message deleted'));
});