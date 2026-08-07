import mongoose, { Schema } from 'mongoose';

const analyticsSchema = new Schema(
  {
    date: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD
    revenue: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    topProducts: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        count: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: false },
);

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;