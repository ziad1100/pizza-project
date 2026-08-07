import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    audience: { type: String, enum: ['all', 'role', 'user'], default: 'user' },
    role: { type: String, default: '' },
    title: { type: String, required: true },
    titleEn: { type: String, default: '' },
    body: { type: String, default: '' },
    bodyEn: { type: String, default: '' },
    type: { type: String, default: 'info' }, // info | order | offer | system
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;