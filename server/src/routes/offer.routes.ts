import { Router } from 'express';
import * as offer from '../controllers/offer.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { logActivity } from '../middlewares/activityLogger';
import { zodBody } from '../middlewares/zod';
import { offerCreateSchema, offerUpdateSchema } from '../schemas';

const router = Router();

router.get('/active', offer.activeOffers);

router.use(requireAuth);
router.use(requirePermission('offers', 'read'));

router.get('/', offer.list);
router.post('/', requirePermission('offers', 'create'), zodBody(offerCreateSchema), logActivity('create', 'offers'), offer.create);
router.patch('/:id', requirePermission('offers', 'update'), zodBody(offerUpdateSchema), logActivity('update', 'offers'), offer.update);
router.delete('/:id', requirePermission('offers', 'delete'), logActivity('delete', 'offers'), offer.remove);

export default router;