import type { Request, Response } from 'express';
import { getSettingsMap, upsertSetting } from '../models/Setting';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getPublic = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse(200, await getSettingsMap()));
});

export const getAdmin = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse(200, await getSettingsMap()));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  for (const [key, value] of Object.entries(req.body)) {
    if (value !== undefined) await upsertSetting(key, value);
  }
  res.json(new ApiResponse(200, await getSettingsMap(), 'Settings updated'));
});