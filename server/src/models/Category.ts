import mongoose, { Schema } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    nameEn: { type: String, default: '' },
    slug: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['section', 'sub'], required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    image: { type: String, default: '' },
    icon: { type: String, default: '' },
    description: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ parentId: 1, order: 1 });

export type ICategory = mongoose.InferSchemaType<typeof categorySchema> & {
  _id: mongoose.Types.ObjectId;
};

const Category = mongoose.model('Category', categorySchema);
export default Category;