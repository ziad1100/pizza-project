import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { ROLES } from '../constants';

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    avatar: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false, default: null },
    emailVerifyToken: { type: String, select: false, default: null },
    emailVerifyExpires: { type: Date, select: false },
    resetToken: { type: String, select: false, default: null },
    resetTokenExpires: { type: Date, select: false },
    addresses: [
      {
        label: { type: String, default: 'home' },
        city: String,
        area: String,
        street: String,
        building: String,
        floor: String,
        notes: String,
      },
    ],
    provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    providerId: { type: String, default: '' },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

const User = mongoose.model('User', userSchema);
export default User;