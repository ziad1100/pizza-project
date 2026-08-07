import mongoose, { Schema } from 'mongoose';
import { COUPON_TYPES } from '../constants';

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, default: '' },
    nameEn: { type: String, default: '' },
    type: { type: String, enum: Object.values(COUPON_TYPES), required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;