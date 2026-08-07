import { Router } from 'express';
import * as post from '../controllers/post.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';

const router = Router();

router.get('/', post.listPublished);
router.get('/:slug', post.getBySlug);

router.use(requireAuth);
router.use(requirePermission('posts', 'read'));

router.get('/all/admin', post.listAll);
router.post('/', requirePermission('posts', 'create'), logActivity('create', 'posts'), post.create);
router.patch('/:id', requirePermission('posts', 'update'), logActivity('update', 'posts'), post.update);
router.delete('/:id', requirePermission('posts', 'delete'), logActivity('delete', 'posts'), post.remove);

export default router;