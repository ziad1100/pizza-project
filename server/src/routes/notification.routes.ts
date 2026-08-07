import { Router } from 'express';
import * as notification from '../controllers/notification.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);

router.get('/', notification.getForUser);
router.patch('/:id/read', notification.markRead);
router.patch('/read-all', notification.markAllRead);
router.post('/send', requirePermission('notifications', 'create'), notification.sendToUsers);

export default router;