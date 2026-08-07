import { Router } from 'express';
import * as coupon from '../controllers/coupon.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';

const router = Router();

router.post('/validate', requireAuth, coupon.validate);

router.use(requireAuth);
router.use(requirePermission('coupons', 'read'));

router.get('/', coupon.list);
router.post('/', requirePermission('coupons', 'create'), logActivity('create', 'coupons'), coupon.create);
router.patch('/:id', requirePermission('coupons', 'update'), logActivity('update', 'coupons'), coupon.update);
router.delete('/:id', requirePermission('coupons', 'delete'), logActivity('delete', 'coupons'), coupon.remove);

export default router;