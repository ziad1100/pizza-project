import { Router } from 'express';
import * as contact from '../controllers/contact.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { contactRules } from '../validators/common.validator';

const router = Router();

router.post('/', contactRules, validate, contact.submit);

router.use(requireAuth);
router.use(requirePermission('contacts', 'read'));

router.get('/', contact.list);
router.patch('/:id/read', contact.markRead);
router.delete('/:id', requirePermission('contacts', 'delete'), contact.remove);

export default router;