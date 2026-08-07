import mongoose, { Schema } from 'mongoose';

const newsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, default: '' },
    source: { type: String, default: 'footer' },
    isSubscribed: { type: Boolean, default: true },
    unsubscribedAt: Date,
  },
  { timestamps: true },
);

const Newsletter = mongoose.model('Newsletter', newsletterSchema);
export default Newsletter;