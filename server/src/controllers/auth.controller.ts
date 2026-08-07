import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Role from '../models/Role';
import env from '../config/env';
import { smtpConfigured } from '../config/mailer';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { clearAuthCookies, setAuthCookies, REFRESH_COOKIE_NAME } from '../utils/cookies';
import { generateEmailCode, generateEmailToken, verifyRefreshToken } from '../utils/token';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email.service';
import { ROLES } from '../constants';

const safeUser = (u: {
  _id: unknown;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  isVerified: boolean;
  addresses: unknown[];
  provider: string;
}) => ({
  id: String(u._id),
  fullName: u.fullName,
  email: u.email,
  phone: u.phone,
  role: u.role,
  avatar: u.avatar,
  isVerified: u.isVerified,
  addresses: u.addresses,
  provider: u.provider,
});

const getUserWithRole = async (id: string) => {
  const user = await User.findById(id).lean();
  if (!user) throw new ApiError(404, 'User not found');
  const role = await Role.findOne({ slug: user.role }).lean();
  return { ...safeUser(user), permissions: (role?.permissions ?? {}) as Record<string, string[]> };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, phone, password, role = ROLES.CUSTOMER, adminCode } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already registered');

  if (role === ROLES.ADMIN) {
    const expectedCode = process.env.ADMIN_REGISTER_CODE;
    if (!expectedCode) throw new ApiError(403, 'Admin registration is disabled');
    if (adminCode !== expectedCode) throw new ApiError(403, 'Invalid admin code');
  }

  const hashed = await bcrypt.hash(password, 10);
  const emailVerifyToken = generateEmailToken();
  const user = await User.create({
    fullName,
    email,
    phone,
    role,
    password: hashed,
    emailVerifyToken,
    emailVerifyExpires: new Date(Date.now() + 24 * 3600 * 1000),
    provider: 'local',
  });

  await sendVerificationEmail(email, emailVerifyToken);

  const { accessToken } = setAuthCookies(res, String(user._id));
  res.status(201).json(new ApiResponse(201, { user: safeUser(user), accessToken }, 'Registered successfully'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');
  const ok = await bcrypt.compare(password, user.password ?? '');
  if (!ok) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  const { accessToken } = setAuthCookies(res, String(user._id));
  res.json(new ApiResponse(200, { user: await getUserWithRole(String(user._id)), accessToken }, 'Logged in'));
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json(new ApiResponse(200, null, 'Logged out'));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) throw new ApiError(401, 'No refresh token');
  let payload;
  try {
    payload = verifyRefreshToken(token) as { sub: string };
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }
  const user = await User.findById(payload.sub).select('+refreshToken');
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found');
  if (user.refreshToken && user.refreshToken !== token) {
    // token reuse detected — force re-login
    clearAuthCookies(res);
    throw new ApiError(401, 'Refresh token reused — please login again');
  }
  const { accessToken, refreshToken } = setAuthCookies(res, String(user._id));
  await User.updateOne({ _id: user._id }, { refreshToken });
  res.json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };
  const user = await User.findOne({ emailVerifyToken: token }).select('+emailVerifyToken +emailVerifyExpires');
  if (!user || !user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }
  user.isVerified = true;
  user.emailVerifyToken = null;
  await user.save();
  res.json(new ApiResponse(200, null, 'Email verified'));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  let devPayload: { code: string; link: string } | null = null;
  if (user) {
    const token = smtpConfigured ? generateEmailToken() : generateEmailCode();
    if (!smtpConfigured) {
      devPayload = { code: token, link: `${env.clientUrl}/reset-password?token=${token}` };
    }
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(email, token);
  }
  // Always respond the same to avoid user enumeration
  res.json(new ApiResponse(200, devPayload, 'If the email exists, a reset link was sent'));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const user = await User.findOne({ resetToken: token }).select('+resetToken +resetTokenExpires');
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }
  user.password = await bcrypt.hash(password, 10);
  user.resetToken = null;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json(new ApiResponse(200, null, 'Password reset successfully'));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById((req as { user?: { id: string } }).user?.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');
  const ok = await bcrypt.compare(currentPassword, user.password ?? '');
  if (!ok) throw new ApiError(400, 'Current password is incorrect');
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json(new ApiResponse(200, null, 'Password changed'));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const id = (req as { user?: { id: string } }).user?.id as string;
  res.json(new ApiResponse(200, await getUserWithRole(id)));
});

export const socialAuthCallback = (provider: 'google' | 'facebook') =>
  asyncHandler(async (req: Request, res: Response) => {
    const profile = req.user as { id: string; displayName: string; emails?: { value: string }[]; photos?: { value: string }[] };
    const email = profile.emails?.[0]?.value ?? `${profile.id}@${provider}.local`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        fullName: profile.displayName,
        email,
        provider,
        providerId: profile.id,
        avatar: profile.photos?.[0]?.value ?? '',
        isVerified: true,
      });
    }
    const { accessToken } = setAuthCookies(res, String(user._id));
    const redirect = `${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}`;
    res.redirect(redirect);
  });
