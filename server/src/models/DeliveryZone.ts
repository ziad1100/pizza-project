import mongoose, { Schema } from 'mongoose';

const deliveryZoneSchema = new Schema(
  {
    name: { type: String, required: true },
    nameEn: { type: String, default: '' },
    fee: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    estimatedMinutes: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const DeliveryZone = mongoose.model('DeliveryZone', deliveryZoneSchema);
export default DeliveryZone;