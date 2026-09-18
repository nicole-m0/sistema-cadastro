import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { uploadImageBuffer, deleteImage } from './upload.service';

const folderSchema = z.enum(['students', 'teachers', 'projects']);

const ALLOWED_UPLOAD_FOLDERS: readonly string[] = folderSchema.options;

// Um publicId só pode ser apagado se estiver dentro do namespace desta aplicação
// (<CLOUDINARY_FOLDER>/<students|teachers|projects>/...). Isso impede que uma sessão
// autenticada apague qualquer asset da conta Cloudinary só por conhecer/adivinhar o
// publicId — sem depender de buscar o registro no banco, já que é possível remover uma
// foto recém-enviada antes mesmo do formulário (aluno/professor/projeto) ser salvo.
// Validação por segmento (não só startsWith): um publicId como
// "asafe/students/../../../outro" começa com o prefixo certo mas escapa do namespace via
// "..", então cada segmento do caminho é conferido individualmente.
function isPublicIdInAppNamespace(publicId: string): boolean {
  const segments = publicId.split('/');
  if (segments.length < 3) return false;
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return false;

  const [rootFolder, subFolder] = segments;
  return rootFolder === env.CLOUDINARY_FOLDER && ALLOWED_UPLOAD_FOLDERS.includes(subFolder);
}

export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('Nenhum arquivo de imagem foi enviado.');
  }

  const folder = folderSchema.safeParse(req.params.folder);
  if (!folder.success) {
    throw ApiError.badRequest('Categoria de upload inválida. Use "students", "teachers" ou "projects".');
  }

  const result = await uploadImageBuffer(req.file.buffer, folder.data);

  res.status(201).json({ success: true, data: result });
});

const deleteSchema = z.object({
  publicId: z.string().min(1, 'publicId é obrigatório'),
});

export const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = deleteSchema.parse(req.body);

  if (!isPublicIdInAppNamespace(publicId)) {
    throw ApiError.forbidden('Não é permitido remover imagens fora do namespace desta aplicação.');
  }

  await deleteImage(publicId);
  res.status(200).json({ success: true, message: 'Imagem removida com sucesso.' });
});
