import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import Role from '../models/Role';
import User from '../models/User';
import { PERMISSION_PRESETS, ROLES } from '../constants';
import { signAccessToken } from '../utils/token';

export const api = request(app);

export const seedRoles = async (): Promise<void> => {
  const defs: { name: string; slug: string; description: string }[] = [
    { name: 'Admin', slug: ROLES.ADMIN, description: 'Full access' },
    { name: 'Manager', slug: ROLES.MANAGER, description: 'Manage content & orders' },
    { name: 'Employee', slug: ROLES.EMPLOYEE, description: 'Orders & reviews' },
    { name: 'Customer', slug: ROLES.CUSTOMER, description: 'Customer account' },
  ];
  for (const d of defs) {
    await Role.updateOne(
      { slug: d.slug },
      {
        $set: {
          name: d.name,
          description: d.description,
          permissions: PERMISSION_PRESETS[d.slug as keyof typeof PERMISSION_PRESETS],
        },
      },
      { upsert: true },
    );
  }
};

export interface UserOverrides {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  provider?: string;
  providerId?: string;
  refreshToken?: string | null;
  emailVerifyToken?: string | null;
  emailVerifyExpires?: Date | null;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
}

let userSeq = 0;

export const createUser = async (overrides: UserOverrides = {}) => {
  userSeq += 1;
  const data = {
    fullName: 'Test User',
    email: `test-${Date.now()}-${userSeq}@pizzahouse.test`,
    phone: '01000000000',
    password: await bcrypt.hash('Pizza123!', 4),
    role: ROLES.CUSTOMER,
    isActive: true,
    isVerified: true,
    provider: 'local',
    ...overrides,
  };
  return User.create(data);
};

export const bearer = (userId: string | mongoose.Types.ObjectId): Record<string, string> => ({
  Authorization: `Bearer ${signAccessToken(String(userId))}`,
});

export const toId = (value: mongoose.Types.ObjectId | string): string => String(value);
