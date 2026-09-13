import { useRef, useState } from 'react';
import { Camera, Trash2, User } from 'lucide-react';
import { Spinner } from './Spinner';
import { useToast } from '../../context/ToastContext';
import * as uploadService from '../../services/upload';
import { isApiError } from '../../context/AuthContext';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface PhotoUploadProps {
  folder: 'students' | 'teachers';
  photoUrl?: string | null;
  photoPublicId?: string | null;
  onChange: (result: { url: string | null; publicId: string | null }) => void;
}

export function PhotoUpload({ folder, photoUrl, photoPublicId, onChange }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showError } = useToast();

  async function handleFileSelected(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('Formato inválido. Envie uma imagem JPG, JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      showError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadService.uploadPhoto(folder, file);
      onChange({ url: res.data.url, publicId: res.data.publicId });
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Falha ao enviar a imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove(currentPublicId?: string | null) {
    onChange({ url: null, publicId: null });
    if (currentPublicId) {
      try {
        await uploadService.deletePhoto(currentPublicId);
      } catch {
        // A remoção da foto do Cloudinary é best-effort; o registro já foi limpo na tela.
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
        {isUploading ? (
          <Spinner />
        ) : photoUrl ? (
          <img src={photoUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
        ) : (
          <User className="h-8 w-8 text-gray-300" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          title="Enviar foto de perfil"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-gray-50 disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
          {photoUrl ? 'Trocar foto' : 'Enviar foto'}
        </button>
        {photoUrl && (
          <button
            type="button"
            onClick={() => handleRemove(photoPublicId)}
            title="Remover foto"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-garnet-600 hover:bg-garnet-50"
          >
            <Trash2 className="h-4 w-4" />
            Remover foto
          </button>
        )}
      </div>
    </div>
  );
}
