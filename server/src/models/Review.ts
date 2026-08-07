import mongoose, { Schema } from 'mongoose';

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    images: { type: [String], default: [] },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;