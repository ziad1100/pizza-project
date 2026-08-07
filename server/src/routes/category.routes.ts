import { Router } from 'express';
import * as category from '../controllers/category.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { categoryCreateSchema, categoryUpdateSchema } from '../schemas';

const router = Router();

router.get('/tree', category.tree);
router.get('/', category.list);
router.get('/:id', category.getById);

router.use(requireAuth);

router.post('/', requirePermission('categories', 'create'), zodBody(categoryCreateSchema), logActivity('create', 'categories'), category.create);
router.patch('/:id', requirePermission('categories', 'update'), zodBody(categoryUpdateSchema), logActivity('update', 'categories'), category.update);
router.patch('/:id/toggle', requirePermission('categories', 'hide'), category.toggle);
router.delete('/:id', requirePermission('categories', 'delete'), logActivity('delete', 'categories'), category.remove);

export default router;