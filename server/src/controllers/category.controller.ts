import type { Request, Response } from 'express';
import Category from '../models/Category';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { slugifyText } from '../utils/slugify';

export const tree = asyncHandler(async (_req: Request, res: Response) => {
  const sections = await Category.find({ type: 'section', isActive: true }).sort('order').lean();
  const subs = await Category.find({ type: 'sub', isActive: true }).sort('order').lean();
  const result = sections.map((s) => ({
    ...s,
    children: subs.filter((x) => String(x.parentId) === String(s._id)),
  }));
  res.json(new ApiResponse(200, result));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const items = await Category.find(filter).sort('order').lean();
  res.json(new ApiResponse(200, items));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const cat = await Category.findById(req.params.id).lean();
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json(new ApiResponse(200, cat));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, nameEn, type, icon, image, description, order, isActive, parentId } = req.body;
  const slug = slugifyText(nameEn || name);
  const cat = await Category.create({
    name,
    nameEn,
    slug: `${type}-${slug}-${Date.now().toString(36)}`,
    type: type ?? 'section',
    icon,
    image,
    description,
    order: Number(order) || 0,
    isActive: isActive ?? true,
    parentId,
  });
  res.status(201).json(new ApiResponse(201, cat, 'Category created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const allowed = ['name', 'nameEn', 'icon', 'image', 'description', 'order', 'isActive', 'parentId', 'type'];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
  const cat = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json(new ApiResponse(200, cat, 'Category updated'));
});

export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  cat.isActive = !cat.isActive;
  await cat.save();
  res.json(new ApiResponse(200, cat));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json(new ApiResponse(200, null, 'Category deleted'));
});