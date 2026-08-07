import { Router } from 'express';
import * as branch from '../controllers/branch.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';

const router = Router();

router.get('/', branch.list);

router.use(requireAuth);
router.use(requirePermission('branches', 'read'));

router.get('/all', branch.listAll);
router.post('/', requirePermission('branches', 'create'), logActivity('create', 'branches'), branch.create);
router.patch('/:id', requirePermission('branches', 'update'), logActivity('update', 'branches'), branch.update);
router.delete('/:id', requirePermission('branches', 'delete'), logActivity('delete', 'branches'), branch.remove);

export default router;