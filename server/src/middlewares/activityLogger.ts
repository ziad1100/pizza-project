import type { RequestHandler } from 'express';
import ActivityLog from '../models/ActivityLog';
import type { AuthRequest } from './auth';

export const logActivity =
  (action: string, resource: string): RequestHandler =>
  async (req, res, next): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      await ActivityLog.create({
        actor: authReq.user?.id,
        role: authReq.user?.role,
        action,
        resource,
        targetId: String(req.params.id ?? ''),
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        changes: req.body && Object.keys(req.body).length ? req.body : undefined,
      });
    } catch {
      // logging must never break the request
    }
    next();
  };
