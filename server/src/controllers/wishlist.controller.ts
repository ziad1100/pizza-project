import type { Response } from 'express';
import Wishlist from '../models/Wishlist';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthRequest } from '../middlewares/auth';

const getOrCreate = async (userId: string) => {
  let wl = await Wishlist.findOne({ user: userId });
  if (!wl) wl = await Wishlist.create({ user: userId, products: [] });
  return wl;
};

export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wl = await getOrCreate(req.user!.id);
  await wl.populate('products');
  res.json(new ApiResponse(200, wl.products));
});

export const toggle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wl = await getOrCreate(req.user!.id);
  const id = req.params.productId;
  const idx = wl.products.findIndex((p) => String(p) === id);
  let added = true;
  if (idx >= 0) {
    wl.products.splice(idx, 1);
    added = false;
  } else {
    wl.products.push(id as never);
  }
  await wl.save();
  res.json(new ApiResponse(200, { added, ids: wl.products.map((p) => String(p)) }));
});

export const clear = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wl = await Wishlist.findOneAndUpdate({ user: req.user!.id }, { products: [] }, { new: true });
  res.json(new ApiResponse(200, wl?.products ?? []));
});