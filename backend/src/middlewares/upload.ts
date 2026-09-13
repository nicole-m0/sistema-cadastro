import multer from 'multer';
import { Request } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return callback(
      ApiError.badRequest('Formato de imagem inválido. Envie JPG, JPEG, PNG ou WebP.'),
    );
  }
  callback(null, true);
}

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES },
  fileFilter,
});
