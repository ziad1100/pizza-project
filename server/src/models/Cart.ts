import mongoose, { Schema } from 'mongoose';

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: Schema.Types.ObjectId, default: null },
    sizeName: { type: String, default: '' },
    extras: [
      {
        _id: false,
        name: String,
        nameEn: String,
        price: Number,
      },
    ],
    qty: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, default: '' },
  },
  { timestamps: true },
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;