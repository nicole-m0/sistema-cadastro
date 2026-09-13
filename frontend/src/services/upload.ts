import { apiRequest } from '../lib/api';
import { ApiResponse } from '../types';

export interface UploadResult {
  url: string;
  publicId: string;
}

export function uploadPhoto(folder: 'students' | 'teachers', file: File) {
  const formData = new FormData();
  formData.append('photo', file);

  return apiRequest<ApiResponse<UploadResult>>(`/upload/${folder}`, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export function deletePhoto(publicId: string) {
  return apiRequest<ApiResponse<null>>('/upload', { method: 'DELETE', body: { publicId } });
}
