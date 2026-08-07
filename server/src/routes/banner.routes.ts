import { Router } from 'express';
import * as banner from '../controllers/banner.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';

const router = Router();

router.get('/active', banner.active);

router.use(requireAuth);
router.use(requirePermission('banners', 'read'));

router.get('/', banner.list);
router.post('/', requirePermission('banners', 'create'), logActivity('create', 'banners'), banner.create);
router.patch('/:id', requirePermission('banners', 'update'), logActivity('update', 'banners'), banner.update);
router.patch('/:id/toggle', banner.toggle);
router.delete('/:id', requirePermission('banners', 'delete'), logActivity('delete', 'banners'), banner.remove);

export default router;