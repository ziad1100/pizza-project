import mongoose, { Schema } from 'mongoose';

const branchSchema = new Schema(
  {
    name: { type: String, required: true },
    nameEn: { type: String, default: '' },
    address: { type: String, default: '' },
    addressEn: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    workHours: { type: String, default: '' },
    workHoursEn: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    googleMapsUrl: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;