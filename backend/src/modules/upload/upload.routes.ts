import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { uploadImage } from '../../middlewares/upload';
import { uploadPhoto, deletePhoto } from './upload.controller';

const router = Router();

router.use(requireAuth);

// POST /api/upload/students  |  POST /api/upload/teachers
router.post('/:folder', uploadImage.single('photo'), uploadPhoto);

// DELETE /api/upload  (body: { publicId })
router.delete('/', deletePhoto);

export default router;
