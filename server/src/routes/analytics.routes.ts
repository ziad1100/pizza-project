import { Router } from 'express';
import * as analytics from '../controllers/analytics.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { cached, invalidateCache } from '../middlewares/cache';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('analytics', 'read'));

router.get('/dashboard', cached({ resource: 'dashboard', ttl: 60, suffix: 'dashboard' }), analytics.dashboard);
router.get('/day', analytics.day);
router.get('/export', analytics.exportStats);
router.post('/refresh', invalidateCache('dashboard'), analytics.refresh);

export default router;