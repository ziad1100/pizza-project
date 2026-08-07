import { Router } from 'express';
import * as analytics from '../controllers/analytics.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';

const router = Router();

router.get('/dashboard', requireAuth, requirePermission('analytics', 'read'), analytics.dashboard);

export default router;