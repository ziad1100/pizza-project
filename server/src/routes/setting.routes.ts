import { Router } from 'express';
import * as setting from '../controllers/setting.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';

const router = Router();

router.get('/public', setting.getPublic);

router.use(requireAuth);
router.use(requirePermission('settings', 'read'));

router.get('/', setting.getAdmin);
router.patch('/', requirePermission('settings', 'update'), logActivity('update', 'settings'), setting.update);

export default router;