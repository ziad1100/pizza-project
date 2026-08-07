import { Router } from 'express';
import * as post from '../controllers/post.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { validate } from '../middlewares/validate';
import { postCreateRules, postRules } from '../validators/common.validator';

const router = Router();

router.get('/', post.listPublished);
router.get('/:slug', post.getBySlug);

router.use(requireAuth);
router.use(requirePermission('posts', 'read'));

router.get('/all/admin', post.listAll);
router.post('/', requirePermission('posts', 'create'), postCreateRules, validate, logActivity('create', 'posts'), post.create);
router.patch('/:id', requirePermission('posts', 'update'), postRules, validate, logActivity('update', 'posts'), post.update);
router.delete('/:id', requirePermission('posts', 'delete'), logActivity('delete', 'posts'), post.remove);

export default router;