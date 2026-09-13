import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { uploadImageBuffer, deleteImage } from './upload.service';

const folderSchema = z.enum(['students', 'teachers']);

export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('Nenhum arquivo de imagem foi enviado.');
  }

  const folder = folderSchema.safeParse(req.params.folder);
  if (!folder.success) {
    throw ApiError.badRequest('Categoria de upload inválida. Use "students" ou "teachers".');
  }

  const result = await uploadImageBuffer(req.file.buffer, folder.data);

  res.status(201).json({ success: true, data: result });
});

const deleteSchema = z.object({
  publicId: z.string().min(1, 'publicId é obrigatório'),
});

export const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = deleteSchema.parse(req.body);
  await deleteImage(publicId);
  res.status(200).json({ success: true, message: 'Imagem removida com sucesso.' });
});
