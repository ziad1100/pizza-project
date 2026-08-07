import type { Response } from 'express';
import { Types } from 'mongoose';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthRequest } from '../middlewares/auth';

const getOrCreate = async (userId: string) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const cartWithProducts = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart) return { items: [], couponCode: '' };
  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } })
    .select('name nameEn images sizes extras basePrice slug')
    .lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const items = cart.items.map((item) => {
    const product = productMap.get(String(item.product));
    const price = item.unitPrice;
    return {
      ...item,
      unitPrice: price,
      product,
    };
  });
  return { items, couponCode: cart.couponCode };
};

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(new ApiResponse(200, await cartWithProducts(req.user!.id)));
});

export const addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { product: productId, size, sizeName, extras, qty } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (!product.isAvailable) throw new ApiError(400, 'Product is not available');

  const selectedSize = product.sizes.find((s) => String(s._id) === String(size));
  const unitPrice = selectedSize?.price ?? product.basePrice;

  const cart = await getOrCreate(req.user!.id);
  const normalized = (child: unknown): unknown =>
    typeof child === 'object' && child !== null && typeof (child as { toObject?: () => unknown }).toObject === 'function'
      ? (child as { toObject: () => unknown }).toObject()
      : child;
  const existing = cart.items.find(
    (i) => String(i.product) === String(productId) && String(i.size ?? '') === String(size ?? ''),
  );
  if (existing) {
    existing.qty += Number(qty) || 1;
    existing.unitPrice = unitPrice;
  } else {
    cart.items.push({
      product: new Types.ObjectId(productId),
      size: size ? new Types.ObjectId(size) : null,
      sizeName: sizeName ?? selectedSize?.name ?? '',
      extras: (extras ?? []).map(normalized),
      qty: Number(qty) || 1,
      unitPrice,
    } as never);
  }
  await cart.save();
  res.json(new ApiResponse(200, await cartWithProducts(req.user!.id), 'Added to cart'));
});

export const updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await getOrCreate(req.user!.id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  if (req.body.qty !== undefined) item.qty = Math.max(1, Number(req.body.qty));
  if (req.body.extras !== undefined) item.extras = req.body.extras;
  await cart.save();
  res.json(new ApiResponse(200, await cartWithProducts(req.user!.id)));
});

export const removeItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await getOrCreate(req.user!.id);
  cart.items.id(req.params.itemId)?.deleteOne();
  await cart.save();
  res.json(new ApiResponse(200, await cartWithProducts(req.user!.id)));
});

export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await getOrCreate(req.user!.id);
  cart.couponCode = String(req.body.code ?? '').toUpperCase();
  await cart.save();
  res.json(new ApiResponse(200, await cartWithProducts(req.user!.id)));
});

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await getOrCreate(req.user!.id);
  cart.items.splice(0, cart.items.length);
  cart.couponCode = '';
  await cart.save();
  res.json(new ApiResponse(200, { items: [] }));
});