import { Router } from 'express';
import * as newsletter from '../controllers/newsletter.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { newsletterRules } from '../validators/common.validator';

const router = Router();

router.post('/subscribe', newsletterRules, validate, newsletter.subscribe);
router.post('/unsubscribe', newsletter.unsubscribe);

router.use(requireAuth);
router.use(requirePermission('newsletter', 'read'));

router.get('/', newsletter.list);

export default router;