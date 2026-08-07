import { Router } from 'express';
import * as upload from '../controllers/upload.controller';
import { requireAuth } from '../middlewares/auth';
import { uploadMultiple, uploadSingle } from '../middlewares/upload';

const router = Router();
router.use(requireAuth);

router.post('/single', uploadSingle, upload.uploadSingle);
router.post('/multiple', uploadMultiple, upload.uploadMultiple);
router.get('/', upload.listFiles);
router.delete('/:filename', upload.removeFile);

export default router;