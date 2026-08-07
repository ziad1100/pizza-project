import mongoose, { Schema } from 'mongoose';

const productSizeSchema = new Schema(
  {
    name: { type: String, required: true }, // صغير / وسط / كبير / حجم واحد
    nameEn: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true },
);

const extraSchema = new Schema(
  {
    name: { type: String, required: true },
    nameEn: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true }, // Arabic name (primary)
    nameEn: { type: String, default: '' },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: { type: [String], default: [] },
    sizes: { type: [productSizeSchema], default: [] },
    extras: { type: [extraSchema], default: [] },
    ingredients: { type: [String], default: [] },
    ingredientsEn: { type: [String], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    preparationTime: { type: Number, default: 20 }, // minutes
    calories: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isBestSeller: { type: Boolean, default: false },
    isOffer: { type: Boolean, default: false },
    tags: { type: [String], default: [] }, // فراخ, لحوم, أسماك, جبن, حار, نباتي
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', nameEn: 'text', description: 'text', descriptionEn: 'text', slug: 'text' });
productSchema.index({ isAvailable: 1, isBestSeller: -1, rating: -1, createdAt: -1 });
productSchema.index({ isAvailable: 1, isOffer: -1, discount: -1, createdAt: -1 });
productSchema.index({ isAvailable: 1, category: 1, createdAt: -1 });

export type IProduct = mongoose.InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Product = mongoose.model('Product', productSchema);
export default Product;