import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as usersRepo from '../db/users';
import { apiErrorFromPg } from '../db';
import env from '../config/env';
import { smtpConfigured } from '../config/mailer';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { clearAuthCookies, setAuthCookies, REFRESH_COOKIE_NAME } from '../utils/cookies';
import { generateEmailCode, generateEmailToken, verifyRefreshToken } from '../utils/token';
import { enqueuePasswordResetOtp, enqueueVerificationEmail } from '../services/email.service';
import { ROLES } from '../constants';

export const getUserWithRole = async (id: string) => {
  const user = await usersRepo.getById(id);
  if (!user) throw new ApiError(404, 'User not found');
  const permissions = await usersRepo.rolePermissions(user.role);
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
    addresses: user.addresses,
    provider: user.provider,
    permissions,
  };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, phone, password, role = ROLES.CUSTOMER, adminCode } = req.body;
  const exists = await usersRepo.getByEmail(email);
  if (exists) throw new ApiError(409, 'Email already registered');

  if (role === ROLES.ADMIN) {
    const expectedCode = process.env.ADMIN_REGISTER_CODE;
    if (!expectedCode) throw new ApiError(403, 'Admin registration is disabled');
    if (adminCode !== expectedCode) throw new ApiError(403, 'Invalid admin code');
  }

  const hashed = await bcrypt.hash(password, 10);
  const emailVerifyToken = generateEmailToken();
  let user;
  try {
    user = await usersRepo.create({
      fullName,
      email,
      phone,
      role,
      passwordHash: hashed,
      emailVerifyToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 3600 * 1000),
      provider: 'local',
    });
  } catch (err) {
    throw apiErrorFromPg(err);
  }

  await enqueueVerificationEmail(email, emailVerifyToken);

  const { accessToken } = setAuthCookies(res, user.id);
  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          addresses: user.addresses,
          provider: user.provider,
        },
        accessToken,
      },
      'Registered successfully',
    ),
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await usersRepo.getByEmail(email);
  if (!user) throw new ApiError(401, 'Invalid email or password');
  const ok = await bcrypt.compare(password, user.passwordHash ?? '');
  if (!ok) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  const { accessToken } = setAuthCookies(res, user.id);
  res.json(new ApiResponse(200, { user: await getUserWithRole(user.id), accessToken }, 'Logged in'));
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
  const user = await usersRepo.getById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found');
  if (user.refreshToken && user.refreshToken !== token) {
    // token reuse detected — force re-login
    clearAuthCookies(res);
    throw new ApiError(401, 'Refresh token reused — please login again');
  }
  const { accessToken, refreshToken } = setAuthCookies(res, user.id);
  await usersRepo.update(user.id, { refreshToken });
  res.json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };
  const user = await usersRepo.getByVerifyToken(token);
  if (!user || !user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }
  await usersRepo.update(user.id, { isVerified: true, emailVerifyToken: null, emailVerifyExpires: null });
  res.json(new ApiResponse(200, null, 'Email verified'));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await usersRepo.getByEmail(email);
  let devPayload: { code: string; link: string } | null = null;
  if (user) {
    const token = generateEmailCode();
    if (!smtpConfigured) {
      devPayload = { code: token, link: `${env.clientUrl}/reset-password?token=${token}` };
    }
    await usersRepo.update(user.id, {
      resetToken: token,
      resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000),
    });
    await enqueuePasswordResetOtp(email, token);
  }
  // Always respond the same to avoid user enumeration
  res.json(new ApiResponse(200, devPayload, 'If the email exists, a reset link was sent'));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const user = await usersRepo.getByResetToken(token);
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await usersRepo.update(user.id, { passwordHash, resetToken: null, resetTokenExpires: null });
  res.json(new ApiResponse(200, null, 'Password reset successfully'));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const id = (req as { user?: { id: string } }).user?.id;
  const user = await usersRepo.getById(id ?? '');
  if (!user) throw new ApiError(404, 'User not found');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash ?? '');
  if (!ok) throw new ApiError(400, 'Current password is incorrect');
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await usersRepo.update(user.id, { passwordHash });
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
    let user = await usersRepo.getByEmail(email);
    if (user) {
      if (!user.isActive) {
        return res.redirect(`${env.clientUrl}/login?error=deactivated`);
      }
      const sets: Record<string, unknown> = { provider, providerId: profile.id };
      if (!user.avatar && profile.photos?.[0]?.value) sets.avatar = profile.photos[0].value;
      await usersRepo.update(user.id, sets);
    } else {
      try {
        user = await usersRepo.create({
          fullName: profile.displayName,
          email,
          provider,
          providerId: profile.id,
          avatar: profile.photos?.[0]?.value ?? '',
          isVerified: true,
        });
      } catch (err) {
        throw apiErrorFromPg(err);
      }
    }
    const { accessToken } = setAuthCookies(res, user.id);
    const redirect = `${env.clientUrl}/auth/callback#accessToken=${accessToken}`;
    res.redirect(redirect);
  });