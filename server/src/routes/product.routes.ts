import { Router } from 'express';
import * as product from '../controllers/product.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { validate } from '../middlewares/validate';
import { productCreateRules } from '../validators/common.validator';

const router = Router();

router.get('/', product.listProducts);
router.get('/admin', requireAuth, requirePermission('products', 'read'), product.adminList);
router.get('/best-sellers', product.getBestSellers);
router.get('/offers', product.getOffers);
router.get('/:slug', product.getProductBySlug);

router.use(requireAuth);

router.post(
  '/',
  requirePermission('products', 'create'),
  productCreateRules,
  validate,
  logActivity('create', 'products'),
  product.createProduct,
);
router.patch(
  '/:id',
  requirePermission('products', 'update'),
  logActivity('update', 'products'),
  product.updateProduct,
);
router.patch(
  '/:id/toggle',
  requirePermission('products', 'hide'),
  logActivity('toggle', 'products'),
  product.toggleProduct,
);
router.delete(
  '/:id',
  requirePermission('products', 'delete'),
  logActivity('delete', 'products'),
  product.deleteProduct,
);

export default router;