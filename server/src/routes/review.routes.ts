import { Router } from 'express';
import * as review from '../controllers/review.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { reviewCreateSchema, reviewModerateSchema } from '../schemas';

const router = Router();

router.get('/product/:productId', review.listByProduct);

router.get('/admin', requireAuth, requirePermission('reviews', 'read'), review.adminList);
router.delete('/admin/:id', requireAuth, requirePermission('reviews', 'delete'), review.adminRemove);

router.patch('/:id/moderate', requireAuth, requirePermission('reviews', 'update'), zodBody(reviewModerateSchema), logActivity('moderate', 'reviews'), review.moderate);

router.post('/', requireAuth, zodBody(reviewCreateSchema), review.create);
router.delete('/:id', requireAuth, review.remove);

export default router;