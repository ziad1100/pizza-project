import mongoose, { Schema } from 'mongoose';

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    titleEn: { type: String, default: '' },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: '' },
    excerptEn: { type: String, default: '' },
    content: { type: String, default: '' },
    contentEn: { type: String, default: '' },
    image: { type: String, default: '' },
    tags: { type: [String], default: [] },
    publishedAt: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Post = mongoose.model('Post', postSchema);
export default Post;