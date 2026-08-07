import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain letters')
  .regex(/[0-9]/, 'Password must contain numbers');

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(80),
    email: z.string().trim().toLowerCase().email('Valid email is required'),
    phone: z.string().trim().max(20).optional(),
    password,
    role: z.enum(['admin', 'customer']).default('customer'),
    adminCode: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === 'admin' && !val.adminCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminCode'], message: 'Admin access code is required' });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain numbers'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
