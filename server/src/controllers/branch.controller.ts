import type { Request, Response } from 'express';
import Branch from '../models/Branch';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const branches = await Branch.find({ isActive: true }).sort('createdAt').lean();
  res.json(new ApiResponse(200, branches));
});

export const listAll = asyncHandler(async (_req: Request, res: Response) => {
  const branches = await Branch.find().sort('createdAt').lean();
  res.json(new ApiResponse(200, branches));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const branch = await Branch.create(req.body);
  res.status(201).json(new ApiResponse(201, branch, 'Branch created'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!branch) throw new ApiError(404, 'Branch not found');
  res.json(new ApiResponse(200, branch, 'Branch updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const branch = await Branch.findByIdAndDelete(req.params.id);
  if (!branch) throw new ApiError(404, 'Branch not found');
  res.json(new ApiResponse(200, null, 'Branch deleted'));
});