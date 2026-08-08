import { Router } from 'express';
import * as category from '../controllers/category.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { cached, invalidateCache } from '../middlewares/cache';
import { categoryCreateSchema, categoryUpdateSchema } from '../schemas';

const router = Router();

router.get('/tree', cached({ resource: 'categories', ttl: 300, suffix: 'tree' }), category.tree);
router.get('/', cached({ resource: 'categories', ttl: 300, suffix: (req) => new URL(req.url, 'http://x').searchParams.get('all') === 'true' ? 'all' : 'active' }), category.list);
router.get('/:id', cached({ resource: 'categories', ttl: 300, suffix: (req) => `id:${req.params.id}` }), category.getById);

router.use(requireAuth);

router.post('/', requirePermission('categories', 'create'), zodBody(categoryCreateSchema), logActivity('create', 'categories'), category.create, invalidateCache('categories', 'products'));
router.patch('/:id', requirePermission('categories', 'update'), zodBody(categoryUpdateSchema), logActivity('update', 'categories'), category.update, invalidateCache('categories', 'products'));
router.patch('/:id/toggle', requirePermission('categories', 'hide'), category.toggle, invalidateCache('categories', 'products'));
router.delete('/:id', requirePermission('categories', 'delete'), logActivity('delete', 'categories'), category.remove, invalidateCache('categories', 'products'));

export default router;