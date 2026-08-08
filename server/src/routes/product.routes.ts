import { Router } from 'express';
import * as product from '../controllers/product.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { cached, invalidateCache } from '../middlewares/cache';
import { productCreateSchema, productUpdateSchema } from '../schemas';

const router = Router();

const querySuffix = (req: { url: string }): string => req.url.split('?')[1] ?? '';

router.get('/', cached({ resource: 'products', ttl: 60, suffix: querySuffix, skip: (req) => Boolean(new URL(req.url, 'http://x').searchParams.get('search')) }), product.listProducts);
router.get('/admin', requireAuth, requirePermission('products', 'read'), product.adminList);
router.get('/best-sellers', cached({ resource: 'products', ttl: 60, suffix: 'best-sellers' }), product.getBestSellers);
router.get('/offers', cached({ resource: 'products', ttl: 60, suffix: 'offers' }), product.getOffers);
router.get('/:slug', cached({ resource: 'products', ttl: 60, suffix: (req) => `slug:${req.params.slug}` }), product.getProductBySlug);

router.use(requireAuth);

router.post(
  '/',
  requirePermission('products', 'create'),
  zodBody(productCreateSchema),
  logActivity('create', 'products'),
  product.createProduct,
  invalidateCache('products', 'offers', 'categories'),
);
router.patch(
  '/:id',
  requirePermission('products', 'update'),
  zodBody(productUpdateSchema),
  logActivity('update', 'products'),
  product.updateProduct,
  invalidateCache('products', 'offers', 'categories'),
);
router.patch(
  '/:id/toggle',
  requirePermission('products', 'hide'),
  logActivity('toggle', 'products'),
  product.toggleProduct,
  invalidateCache('products', 'offers', 'categories'),
);
router.delete(
  '/:id',
  requirePermission('products', 'delete'),
  logActivity('delete', 'products'),
  product.deleteProduct,
  invalidateCache('products', 'offers', 'categories'),
);

export default router;