import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import * as teachersService from '../../services/teachers';
import { useInstruments } from '../../hooks/useInstruments';
import { InputField, SelectField, TextareaField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { PhotoUpload } from '../../components/ui/PhotoUpload';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const teacherFormSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe o nome completo (mínimo 3 caracteres).'),
  socialName: z.preprocess(emptyToUndefined, z.string().optional()),
  document: z.preprocess(emptyToUndefined, z.string().optional()),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  whatsapp: z.preprocess(emptyToUndefined, z.string().optional()),
  email: z.preprocess(emptyToUndefined, z.string().email('E-mail inválido.').optional()),
  address: z.preprocess(emptyToUndefined, z.string().optional()),
  specialty: z.preprocess(emptyToUndefined, z.string().optional()),
  hireDate: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  bio: z.preprocess(emptyToUndefined, z.string().optional()),
  instrumentIds: z.array(z.string()).default([]),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

export function TeacherForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { instruments } = useInstruments();

  const [isLoadingTeacher, setIsLoadingTeacher] = useState(isEditing);
  const [photo, setPhoto] = useState<{ url: string | null; publicId: string | null }>({
    url: null,
    publicId: null,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: { status: 'ACTIVE', instrumentIds: [] },
  });

  useEffect(() => {
    if (!id) return;
    teachersService
      .getTeacher(id)
      .then((res) => {
        const t = res.data;
        reset({
          fullName: t.fullName,
          socialName: t.socialName ?? undefined,
          document: t.document ?? undefined,
          phone: t.phone ?? undefined,
          whatsapp: t.whatsapp ?? undefined,
          email: t.email ?? undefined,
          address: t.address ?? undefined,
          specialty: t.specialty ?? undefined,
          hireDate: t.hireDate ? t.hireDate.substring(0, 10) : undefined,
          status: t.status,
          bio: t.bio ?? undefined,
          instrumentIds: t.instruments.map((i) => i.id),
        });
        setPhoto({ url: t.photoUrl ?? null, publicId: t.photoPublicId ?? null });
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o professor.');
        navigate('/professores');
      })
      .finally(() => setIsLoadingTeacher(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(data: TeacherFormData) {
    try {
      const payload = { ...data, photoUrl: photo.url ?? undefined, photoPublicId: photo.publicId ?? undefined };
      if (isEditing && id) {
        await teachersService.updateTeacher(id, payload);
        showSuccess('Professor atualizado com sucesso.');
      } else {
        await teachersService.createTeacher(payload);
        showSuccess('Professor cadastrado com sucesso.');
      }
      navigate('/professores');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível salvar o professor.');
    }
  }

  if (isLoadingTeacher) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Foto de perfil</h2>
        <PhotoUpload
          folder="teachers"
          photoUrl={photo.url}
          photoPublicId={photo.publicId}
          onChange={setPhoto}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Dados pessoais</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Nome completo" required error={errors.fullName?.message} {...register('fullName')} />
          <InputField label="Nome social" error={errors.socialName?.message} {...register('socialName')} />
          <InputField label="CPF / Documento" error={errors.document?.message} {...register('document')} />
          <InputField label="Telefone" error={errors.phone?.message} {...register('phone')} />
          <InputField label="WhatsApp" error={errors.whatsapp?.message} {...register('whatsapp')} />
          <InputField label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          <InputField label="Endereço" error={errors.address?.message} {...register('address')} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Dados profissionais</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Especialidade" error={errors.specialty?.message} {...register('specialty')} />
          <InputField label="Data de contratação" type="date" error={errors.hireDate?.message} {...register('hireDate')} />
          <SelectField label="Status" required error={errors.status?.message} {...register('status')}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </SelectField>
        </div>

        <div className="mt-4">
          <span className="mb-2 block text-sm font-medium text-ink">Instrumentos que leciona</span>
          <Controller
            control={control}
            name="instrumentIds"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
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

        <div className="mt-4">
          <TextareaField label="Biografia / Observações" error={errors.bio?.message} {...register('bio')} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/professores')}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Save className="h-4 w-4" />
          {isEditing ? 'Salvar alterações' : 'Cadastrar professor'}
        </Button>
      </div>
    </form>
  );
}
