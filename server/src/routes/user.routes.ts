import { Router } from 'express';
import * as user from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);

router.get('/profile', user.getProfile);
router.patch('/profile', user.updateProfile);

export default router;