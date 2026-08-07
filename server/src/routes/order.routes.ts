import { Router } from 'express';
import * as order from '../controllers/order.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { validate } from '../middlewares/validate';
import { orderRules } from '../validators/common.validator';

const router = Router();

router.use(requireAuth);

router.post('/', orderRules, validate, order.createOrder);
router.post('/:id/cancel', order.cancelOrder);
router.get('/history', order.history);
router.get('/stats', requirePermission('orders', 'read'), order.stats);
router.get('/admin', requirePermission('orders', 'read'), order.adminList);
router.patch('/:id/status', requirePermission('orders', 'update'), logActivity('status', 'orders'), order.updateStatus);

export default router;