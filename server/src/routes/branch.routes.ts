import { Router } from 'express';
import * as branch from '../controllers/branch.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { branchCreateSchema, branchUpdateSchema } from '../schemas';

const router = Router();

router.get('/', branch.list);

router.use(requireAuth);
router.use(requirePermission('branches', 'read'));

router.get('/all', branch.listAll);
router.post('/', requirePermission('branches', 'create'), zodBody(branchCreateSchema), logActivity('create', 'branches'), branch.create);
router.patch('/:id', requirePermission('branches', 'update'), zodBody(branchUpdateSchema), logActivity('update', 'branches'), branch.update);
router.delete('/:id', requirePermission('branches', 'delete'), logActivity('delete', 'branches'), branch.remove);

export default router;