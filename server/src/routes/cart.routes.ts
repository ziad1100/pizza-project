import { Router } from 'express';
import * as cart from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);

router.get('/', cart.getCart);
router.post('/items', cart.addItem);
router.patch('/items/:itemId', cart.updateItem);
router.delete('/items/:itemId', cart.removeItem);
router.post('/coupon', cart.applyCoupon);
router.delete('/', cart.clearCart);

export default router;