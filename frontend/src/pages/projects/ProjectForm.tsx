import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import * as projectsService from '../../services/projects';
import { useInstruments } from '../../hooks/useInstruments';
import { InputField, SelectField, TextareaField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { PhotoUpload } from '../../components/ui/PhotoUpload';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const projectFormSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome do projeto (mínimo 3 caracteres).'),
  description: z.preprocess(emptyToUndefined, z.string().optional()),
  objective: z.preprocess(emptyToUndefined, z.string().optional()),
  location: z.preprocess(emptyToUndefined, z.string().optional()),
  responsible: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.enum(['PLANNING', 'ACTIVE', 'CLOSED', 'ARCHIVED']),
  startDate: z.preprocess(emptyToUndefined, z.string().optional()),
  endDate: z.preprocess(emptyToUndefined, z.string().optional()),
  instrumentIds: z.array(z.string()).default([]),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export function ProjectForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { instruments } = useInstruments({ onlyActive: true });

  const [isLoadingProject, setIsLoadingProject] = useState(isEditing);
  const [image, setImage] = useState<{ url: string | null; publicId: string | null }>({
    url: null,
    publicId: null,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { status: 'PLANNING', instrumentIds: [] },
  });

  useEffect(() => {
    if (!id) return;
    projectsService
      .getProject(id)
      .then((res) => {
        const p = res.data;
        reset({
          name: p.name,
          description: p.description ?? undefined,
          objective: p.objective ?? undefined,
          location: p.location ?? undefined,
          responsible: p.responsible ?? undefined,
          notes: p.notes ?? undefined,
          status: p.status,
          startDate: p.startDate ? p.startDate.substring(0, 10) : undefined,
          endDate: p.endDate ? p.endDate.substring(0, 10) : undefined,
          instrumentIds: p.instruments.map((i) => i.id),
        });
        setImage({ url: p.imageUrl ?? null, publicId: p.imagePublicId ?? null });
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o projeto.');
        navigate('/projetos');
      })
      .finally(() => setIsLoadingProject(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(data: ProjectFormData) {
    try {
      const payload = {
        ...data,
        imageUrl: image.url ?? undefined,
        imagePublicId: image.publicId ?? undefined,
      };
      if (isEditing && id) {
        await projectsService.updateProject(id, payload);
        showSuccess('Projeto atualizado com sucesso.');
      } else {
        await projectsService.createProject(payload);
        showSuccess('Projeto cadastrado com sucesso.');
      }
      navigate('/projetos');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível salvar o projeto.');
    }
  }

  if (isLoadingProject) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Logo ou imagem</h2>
        <PhotoUpload folder="projects" photoUrl={image.url} photoPublicId={image.publicId} onChange={setImage} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Informações gerais</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Nome" required error={errors.name?.message} {...register('name')} />
          <InputField label="Local" error={errors.location?.message} {...register('location')} />
          <InputField label="Responsável" error={errors.responsible?.message} {...register('responsible')} />
          <SelectField label="Status" required error={errors.status?.message} {...register('status')}>
            <option value="PLANNING">Planejamento</option>
            <option value="ACTIVE">Ativo</option>
            <option value="CLOSED">Encerrado</option>
            <option value="ARCHIVED">Arquivado</option>
          </SelectField>
          <InputField label="Data de início" type="date" error={errors.startDate?.message} {...register('startDate')} />
          <InputField label="Data de término" type="date" error={errors.endDate?.message} {...register('endDate')} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <TextareaField label="Descrição" error={errors.description?.message} {...register('description')} />
          <TextareaField label="Objetivo" error={errors.objective?.message} {...register('objective')} />
          <TextareaField label="Observações" error={errors.notes?.message} {...register('notes')} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Instrumentos utilizados</h2>
        <p className="mb-3 text-sm text-gray-500">
          Apenas instrumentos ativos do catálogo podem ser selecionados.
        </p>
        <Controller
          control={control}
          name="instrumentIds"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {instruments.length === 0 && (
                <p className="text-sm text-gray-400">Nenhum instrumento ativo cadastrado.</p>
              )}
              {instruments.map((instrument) => {
                const checked = field.value.includes(instrument.id);
                return (
                  <label
                    key={instrument.id}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      checked
                        ? 'border-garnet-500 bg-garnet-50 text-garnet-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        field.onChange(
                          checked
                            ? field.value.filter((v) => v !== instrument.id)
                            : [...field.value, instrument.id],
                        );
                      }}
                    />
                    {instrument.name}
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/projetos')}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Save className="h-4 w-4" />
          {isEditing ? 'Salvar alterações' : 'Cadastrar projeto'}
        </Button>
      </div>
    </form>
  );
}
