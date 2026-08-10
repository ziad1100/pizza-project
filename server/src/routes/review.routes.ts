import { Router } from 'express';
import * as review from '../controllers/review.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { cached, invalidateCache } from '../middlewares/cache';
import { reviewCreateSchema, reviewModerateSchema } from '../schemas';

const router = Router();

router.get(
  '/product/:productId',
  cached({
    resource: 'products',
    ttl: 60,
    suffix: (req) => `reviews:${req.params.productId}:${new URL(req.url, 'http://x').searchParams.get('page') ?? '1'}`,
    skip: (req) => Boolean(new URL(req.url, 'http://x').searchParams.get('refresh')),
  }),
  review.listByProduct,
);

router.get('/admin', requireAuth, requirePermission('reviews', 'read'), review.adminList);
router.delete('/admin/:id', requireAuth, requirePermission('reviews', 'delete'), invalidateCache('products'), review.adminRemove);

router.patch('/:id/moderate', requireAuth, requirePermission('reviews', 'update'), zodBody(reviewModerateSchema), logActivity('moderate', 'reviews'), invalidateCache('products'), review.moderate);

router.post('/', requireAuth, zodBody(reviewCreateSchema), invalidateCache('products'), review.create);
router.delete('/:id', requireAuth, invalidateCache('products'), review.remove);

export default router;