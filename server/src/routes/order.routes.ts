import { Router } from 'express';
import * as order from '../controllers/order.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { invalidateCache } from '../middlewares/cache';
import { createOrderSchema, updateStatusSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.post('/', zodBody(createOrderSchema), order.createOrder, invalidateCache('dashboard'));
router.post('/:id/cancel', order.cancelOrder, invalidateCache('dashboard'));
router.get('/history', order.history);
router.get('/stats', requirePermission('orders', 'read'), order.stats);
router.get('/admin', requirePermission('orders', 'read'), order.adminList);
router.patch('/:id/status', requirePermission('orders', 'update'), zodBody(updateStatusSchema), logActivity('status', 'orders'), order.updateStatus, invalidateCache('dashboard'));

export default router;