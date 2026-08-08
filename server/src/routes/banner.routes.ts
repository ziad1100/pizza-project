import { Router } from 'express';
import * as banner from '../controllers/banner.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { cached, invalidateCache } from '../middlewares/cache';
import { bannerCreateSchema, bannerUpdateSchema } from '../schemas';

const router = Router();

router.get('/active', cached({ resource: 'banners', ttl: 60, suffix: 'active' }), banner.active);

router.use(requireAuth);
router.use(requirePermission('banners', 'read'));

router.get('/', banner.list);
router.post('/', requirePermission('banners', 'create'), zodBody(bannerCreateSchema), logActivity('create', 'banners'), banner.create, invalidateCache('banners'));
router.patch('/:id', requirePermission('banners', 'update'), zodBody(bannerUpdateSchema), logActivity('update', 'banners'), banner.update, invalidateCache('banners'));
router.patch('/:id/toggle', banner.toggle, invalidateCache('banners'));
router.delete('/:id', requirePermission('banners', 'delete'), logActivity('delete', 'banners'), banner.remove, invalidateCache('banners'));

export default router;