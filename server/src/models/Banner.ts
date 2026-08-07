import mongoose, { Schema } from 'mongoose';

const bannerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    image: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    buttonLink: { type: String, default: '' },
    position: { type: String, enum: ['hero', 'home', 'deals'], default: 'home' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;