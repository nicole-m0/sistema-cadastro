import { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../../config/cloudinary';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

export interface UploadResult {
  url: string;
  publicId: string;
}

export function uploadImageBuffer(buffer: Buffer, folder: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
        resource_type: 'image',
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(ApiError.badRequest('Falha ao enviar imagem para o Cloudinary.', error));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw ApiError.badRequest('Falha ao remover imagem do Cloudinary.', error);
  }
}
