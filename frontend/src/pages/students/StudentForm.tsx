import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import * as studentsService from '../../services/students';
import { useInstruments } from '../../hooks/useInstruments';
import { useTeacherOptions } from '../../hooks/useTeacherOptions';
import { InputField, SelectField, TextareaField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { PhotoUpload } from '../../components/ui/PhotoUpload';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const studentFormSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe o nome completo (mínimo 3 caracteres).'),
  socialName: z.preprocess(emptyToUndefined, z.string().optional()),
  birthDate: z.preprocess(emptyToUndefined, z.string().optional()),
  document: z.preprocess(emptyToUndefined, z.string().optional()),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  whatsapp: z.preprocess(emptyToUndefined, z.string().optional()),
  email: z.preprocess(emptyToUndefined, z.string().email('E-mail inválido.').optional()),
  address: z.preprocess(emptyToUndefined, z.string().optional()),
  city: z.preprocess(emptyToUndefined, z.string().optional()),
  state: z.preprocess(emptyToUndefined, z.string().optional()),
  instrumentId: z.preprocess(emptyToUndefined, z.string().optional()),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  teacherId: z.preprocess(emptyToUndefined, z.string().optional()),
  enrollmentDate: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

export function StudentForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { instruments } = useInstruments();
  const { teachers } = useTeacherOptions();

  const [isLoadingStudent, setIsLoadingStudent] = useState(isEditing);
  const [photo, setPhoto] = useState<{ url: string | null; publicId: string | null }>({
    url: null,
    publicId: null,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { level: 'BEGINNER', status: 'ACTIVE' },
  });

  useEffect(() => {
    if (!id) return;
    studentsService
      .getStudent(id)
      .then((res) => {
        const s = res.data;
        reset({
          fullName: s.fullName,
          socialName: s.socialName ?? undefined,
          birthDate: s.birthDate ? s.birthDate.substring(0, 10) : undefined,
          document: s.document ?? undefined,
          phone: s.phone ?? undefined,
          whatsapp: s.whatsapp ?? undefined,
          email: s.email ?? undefined,
          address: s.address ?? undefined,
          city: s.city ?? undefined,
          state: s.state ?? undefined,
          instrumentId: s.instrumentId ?? undefined,
          level: s.level,
          teacherId: s.teacherId ?? undefined,
          enrollmentDate: s.enrollmentDate ? s.enrollmentDate.substring(0, 10) : undefined,
          status: s.status,
          notes: s.notes ?? undefined,
        });
        setPhoto({ url: s.photoUrl ?? null, publicId: s.photoPublicId ?? null });
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o aluno.');
        navigate('/alunos');
      })
      .finally(() => setIsLoadingStudent(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(data: StudentFormData) {
    try {
      const payload = { ...data, photoUrl: photo.url ?? undefined, photoPublicId: photo.publicId ?? undefined };
      if (isEditing && id) {
        await studentsService.updateStudent(id, payload);
        showSuccess('Aluno atualizado com sucesso.');
      } else {
        await studentsService.createStudent(payload);
        showSuccess('Aluno cadastrado com sucesso.');
      }
      navigate('/alunos');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível salvar o aluno.');
    }
  }

  if (isLoadingStudent) {
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
          folder="students"
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
          <InputField label="Data de nascimento" type="date" error={errors.birthDate?.message} {...register('birthDate')} />
          <InputField label="CPF / Documento" error={errors.document?.message} {...register('document')} />
          <InputField label="Telefone" error={errors.phone?.message} {...register('phone')} />
          <InputField label="WhatsApp" error={errors.whatsapp?.message} {...register('whatsapp')} />
          <InputField label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          <InputField label="Endereço" error={errors.address?.message} {...register('address')} />
          <InputField label="Cidade" error={errors.city?.message} {...register('city')} />
          <InputField label="Estado" placeholder="UF" maxLength={2} error={errors.state?.message} {...register('state')} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Matrícula</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Instrumento / Curso" error={errors.instrumentId?.message} {...register('instrumentId')}>
            <option value="">Selecione...</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Nível musical" required error={errors.level?.message} {...register('level')}>
            <option value="BEGINNER">Iniciante</option>
            <option value="INTERMEDIATE">Intermediário</option>
            <option value="ADVANCED">Avançado</option>
          </SelectField>
          <SelectField label="Professor responsável" error={errors.teacherId?.message} {...register('teacherId')}>
            <option value="">Sem professor definido</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Data de matrícula"
            type="date"
            error={errors.enrollmentDate?.message}
            {...register('enrollmentDate')}
          />
          <SelectField label="Status" required error={errors.status?.message} {...register('status')}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="LOCKED">Trancado</option>
          </SelectField>
        </div>
        <div className="mt-4">
          <TextareaField label="Observações" error={errors.notes?.message} {...register('notes')} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/alunos')}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Save className="h-4 w-4" />
          {isEditing ? 'Salvar alterações' : 'Cadastrar aluno'}
        </Button>
      </div>
    </form>
  );
}
