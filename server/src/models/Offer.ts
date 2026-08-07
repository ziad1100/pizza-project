import mongoose, { Schema } from 'mongoose';
import { OFFER_TYPES } from '../constants';

const offerSchema = new Schema(
  {
    title: { type: String, required: true },
    titleEn: { type: String, default: '' },
    description: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    banner: { type: String, default: '' },
    discountType: { type: String, enum: Object.values(OFFER_TYPES), default: 'percent' },
    discountValue: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    theme: { type: String, enum: ['dark', 'red', 'gold'], default: 'dark' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;