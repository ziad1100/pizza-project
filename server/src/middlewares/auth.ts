import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Role from '../models/Role';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/token';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: Record<string, string[]>;
  };
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authReq = req as AuthRequest;
    const header = authReq.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }
    const token = header.split(' ')[1];
    let payload: jwt.JwtPayload;
    try {
      payload = verifyAccessToken(token) as jwt.JwtPayload;
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }
    const user = await User.findById(payload.sub).select('+password').lean();
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Account not found or deactivated');
    }
    const role = await Role.findOne({ slug: user.role }).lean();
    authReq.user = {
      id: String(user._id),
      role: user.role,
      permissions: (role?.permissions as Record<string, string[]>) ?? {},
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const requirePermission =
  (resource: string, action: string): RequestHandler =>
  (req, _res, next) => {
    const perms = (req as AuthRequest).user?.permissions?.[resource];
    if (!perms || !perms.includes(action)) {
      next(new ApiError(403, `You do not have permission: ${action} ${resource}`));
      return;
    }
    next();
  };

export const requireRole =
  (...roles: string[]): RequestHandler =>
  (req, _res, next) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      next(new ApiError(403, 'Insufficient role privileges'));
      return;
    }
    next();
  };
