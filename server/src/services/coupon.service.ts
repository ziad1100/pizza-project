import Coupon from '../models/Coupon';
import { COUPON_TYPES } from '../constants';
import { ApiError } from '../utils/ApiError';

export interface CouponDiscount {
  code: string;
  amount: number;
  type: string;
}

export const validateCoupon = async (
  code: string,
  userId: string,
  subtotal: number,
): Promise<CouponDiscount> => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(404, 'Invalid coupon code');
  const now = new Date();
  if (coupon.startDate && coupon.startDate > now) throw new ApiError(400, 'Coupon is not active yet');
  if (coupon.endDate && coupon.endDate < now) throw new ApiError(400, 'Coupon has expired');
  if (subtotal < coupon.minOrder) {
    throw new ApiError(400, `Minimum order for this coupon is ${coupon.minOrder} EGP`);
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }

  let amount: number;

  if (coupon.type === COUPON_TYPES.PERCENT) {
    const percentAmount = (subtotal * coupon.value) / 100;
    amount = coupon.maxDiscount > 0 && percentAmount > coupon.maxDiscount ? coupon.maxDiscount : percentAmount;
  } else {
    amount = Math.min(coupon.value, subtotal);
  }

  return { code: coupon.code, amount: Math.round(amount * 100) / 100, type: coupon.type };
};

export const incrementCouponUsage = async (code: string): Promise<void> => {
  await Coupon.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
};