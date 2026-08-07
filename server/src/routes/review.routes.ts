import { Router } from 'express';
import * as review from '../controllers/review.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { validate } from '../middlewares/validate';
import { reviewRules } from '../validators/common.validator';

const router = Router();

router.get('/product/:productId', review.listByProduct);

router.get('/admin', requireAuth, requirePermission('reviews', 'read'), review.adminList);
router.delete('/admin/:id', requireAuth, requirePermission('reviews', 'delete'), review.adminRemove);

router.patch('/:id/moderate', requireAuth, requirePermission('reviews', 'update'), logActivity('moderate', 'reviews'), review.moderate);

router.post('/', requireAuth, reviewRules, validate, review.create);
router.delete('/:id', requireAuth, review.remove);

export default router;