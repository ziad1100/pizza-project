import { Router } from 'express';
import * as analytics from '../controllers/analytics.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { cached } from '../middlewares/cache';

const router = Router();

router.get('/dashboard', requireAuth, requirePermission('analytics', 'read'), cached({ resource: 'dashboard', ttl: 60, suffix: 'dashboard' }), analytics.dashboard);

export default router;