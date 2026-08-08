import { Router } from 'express';
import * as offer from '../controllers/offer.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { cached, invalidateCache } from '../middlewares/cache';
import { offerCreateSchema, offerUpdateSchema } from '../schemas';

const router = Router();

router.get('/active', cached({ resource: 'offers', ttl: 60, suffix: 'active' }), offer.activeOffers);
router.get('/:id', cached({ resource: 'offers', ttl: 60, suffix: (req) => req.params.id }), offer.getOne);

router.use(requireAuth);
router.use(requirePermission('offers', 'read'));

router.get('/', offer.list);
router.post('/', requirePermission('offers', 'create'), zodBody(offerCreateSchema), logActivity('create', 'offers'), offer.create, invalidateCache('offers', 'products'));
router.patch('/:id', requirePermission('offers', 'update'), zodBody(offerUpdateSchema), logActivity('update', 'offers'), offer.update, invalidateCache('offers', 'products'));
router.delete('/:id', requirePermission('offers', 'delete'), logActivity('delete', 'offers'), offer.remove, invalidateCache('offers', 'products'));

export default router;