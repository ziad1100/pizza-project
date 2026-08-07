import mongoose, { Schema } from 'mongoose';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../constants';

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    size: { type: String, default: '' },
    extras: [
      {
        _id: false,
        name: String,
        price: Number,
      },
    ],
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const paymentSchema = new Schema(
  {
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    reference: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    paidAt: Date,
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    total: { type: Number, required: true, min: 0 },
    payment: { type: paymentSchema, required: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    deliveryAddress: {
      city: String,
      area: String,
      street: String,
      building: String,
      floor: String,
      notes: String,
    },
    phone: { type: String, required: true },
    customerName: { type: String, required: true },
    notes: { type: String, default: '' },
    statusHistory: [
      {
        status: String,
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

orderSchema.index({ status: 1, createdAt: -1 });

export type IOrder = mongoose.InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Order = mongoose.model('Order', orderSchema);
export default Order;