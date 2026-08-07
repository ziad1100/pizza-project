import { Router } from 'express';
import * as post from '../controllers/post.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { postCreateSchema, postUpdateSchema } from '../schemas';

const router = Router();

router.get('/', post.listPublished);
router.get('/:slug', post.getBySlug);

router.use(requireAuth);
router.use(requirePermission('posts', 'read'));

router.get('/all/admin', post.listAll);
router.post('/', requirePermission('posts', 'create'), zodBody(postCreateSchema), logActivity('create', 'posts'), post.create);
router.patch('/:id', requirePermission('posts', 'update'), zodBody(postUpdateSchema), logActivity('update', 'posts'), post.update);
router.delete('/:id', requirePermission('posts', 'delete'), logActivity('delete', 'posts'), post.remove);

export default router;