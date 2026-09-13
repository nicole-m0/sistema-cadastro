import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import * as classGroupsService from '../../services/classGroups';
import * as projectsService from '../../services/projects';
import { useProjects } from '../../hooks/useProjects';
import { useTeacherOptions } from '../../hooks/useTeacherOptions';
import { Instrument } from '../../types';
import { InputField, SelectField, TextareaField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const classGroupFormSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome da turma (mínimo 3 caracteres).'),
  projectId: z.string().min(1, 'Selecione um projeto.'),
  instrumentId: z.string().min(1, 'Selecione um instrumento.'),
  weekday: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(timeRegex, 'Informe um horário válido (HH:mm).'),
  endTime: z.preprocess(
    emptyToUndefined,
    z.string().regex(timeRegex, 'Informe um horário válido (HH:mm).').optional(),
  ),
  room: z.preprocess(emptyToUndefined, z.string().optional()),
  capacity: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  status: z.enum(['ACTIVE', 'CLOSED', 'SUSPENDED']),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  startDate: z.preprocess(emptyToUndefined, z.string().optional()),
  endDate: z.preprocess(emptyToUndefined, z.string().optional()),
  responsibleTeacherId: z.string().min(1, 'Selecione o professor responsável.'),
  assistantTeacherIds: z.array(z.string()).default([]),
});

type ClassGroupFormData = z.infer<typeof classGroupFormSchema>;

const weekdayOptions: { value: ClassGroupFormData['weekday']; label: string }[] = [
  { value: 'MONDAY', label: 'Segunda-feira' },
  { value: 'TUESDAY', label: 'Terça-feira' },
  { value: 'WEDNESDAY', label: 'Quarta-feira' },
  { value: 'THURSDAY', label: 'Quinta-feira' },
  { value: 'FRIDAY', label: 'Sexta-feira' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

export function ClassGroupForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { projects } = useProjects();
  const { teachers } = useTeacherOptions();

  const [isLoadingClassGroup, setIsLoadingClassGroup] = useState(isEditing);
  const [projectInstruments, setProjectInstruments] = useState<Instrument[]>([]);
  const [isLoadingProjectInstruments, setIsLoadingProjectInstruments] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClassGroupFormData>({
    resolver: zodResolver(classGroupFormSchema),
    defaultValues: {
      status: 'ACTIVE',
      weekday: 'MONDAY',
      projectId: searchParams.get('projectId') ?? '',
      assistantTeacherIds: [],
    },
  });

  const projectId = watch('projectId');
  const responsibleTeacherId = watch('responsibleTeacherId');

  useEffect(() => {
    if (!projectId) {
      setProjectInstruments([]);
      return;
    }
    setIsLoadingProjectInstruments(true);
    projectsService
      .getProject(projectId)
      .then((res) => setProjectInstruments(res.data.instruments))
      .catch(() => setProjectInstruments([]))
      .finally(() => setIsLoadingProjectInstruments(false));
  }, [projectId]);

  useEffect(() => {
    if (!id) return;
    classGroupsService
      .getClassGroup(id)
      .then((res) => {
        const cg = res.data;
        const responsible = cg.teachers.find((t) => t.role === 'RESPONSIBLE');
        const assistants = cg.teachers.filter((t) => t.role === 'ASSISTANT');
        reset({
          name: cg.name,
          projectId: cg.projectId,
          instrumentId: cg.instrumentId,
          weekday: cg.weekday,
          startTime: cg.startTime,
          endTime: cg.endTime ?? undefined,
          room: cg.room ?? undefined,
          capacity: cg.capacity ?? undefined,
          status: cg.status,
          notes: cg.notes ?? undefined,
          startDate: cg.startDate ? cg.startDate.substring(0, 10) : undefined,
          endDate: cg.endDate ? cg.endDate.substring(0, 10) : undefined,
          responsibleTeacherId: responsible?.id ?? '',
          assistantTeacherIds: assistants.map((t) => t.id),
        });
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar a turma.');
        navigate('/turmas');
      })
      .finally(() => setIsLoadingClassGroup(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(data: ClassGroupFormData) {
    try {
      if (isEditing && id) {
        await classGroupsService.updateClassGroup(id, data);
        showSuccess('Turma atualizada com sucesso.');
      } else {
        await classGroupsService.createClassGroup(data);
        showSuccess('Turma cadastrada com sucesso.');
      }
      navigate('/turmas');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível salvar a turma.');
    }
  }

  if (isLoadingClassGroup) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Dados da turma</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Nome da turma" required error={errors.name?.message} {...register('name')} />
          <SelectField label="Projeto" required error={errors.projectId?.message} {...register('projectId')}>
            <option value="">Selecione...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Instrumento"
            required
            hint={
              !projectId
                ? 'Selecione um projeto primeiro.'
                : isLoadingProjectInstruments
                  ? 'Carregando instrumentos do projeto...'
                  : undefined
            }
            error={errors.instrumentId?.message}
            disabled={!projectId || isLoadingProjectInstruments}
            {...register('instrumentId')}
          >
            <option value="">Selecione...</option>
            {projectInstruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Status" required error={errors.status?.message} {...register('status')}>
            <option value="ACTIVE">Ativa</option>
            <option value="CLOSED">Encerrada</option>
            <option value="SUSPENDED">Suspensa</option>
          </SelectField>
          <SelectField label="Dia da semana" required error={errors.weekday?.message} {...register('weekday')}>
            {weekdayOptions.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </SelectField>
          <InputField label="Sala / Local" error={errors.room?.message} {...register('room')} />
          <InputField label="Horário de início" placeholder="HH:mm" error={errors.startTime?.message} {...register('startTime')} />
          <InputField label="Horário de término" placeholder="HH:mm" error={errors.endTime?.message} {...register('endTime')} />
          <InputField
            label="Capacidade máxima"
            type="number"
            error={errors.capacity?.message}
            {...register('capacity')}
          />
          <InputField label="Data de início" type="date" error={errors.startDate?.message} {...register('startDate')} />
          <InputField label="Data de término" type="date" error={errors.endDate?.message} {...register('endDate')} />
        </div>
        <div className="mt-4">
          <TextareaField label="Observações" error={errors.notes?.message} {...register('notes')} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Professores</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Professor responsável"
            required
            error={errors.responsibleTeacherId?.message}
            {...register('responsibleTeacherId')}
          >
            <option value="">Selecione...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="mt-4">
          <span className="mb-2 block text-sm font-medium text-ink">Professores auxiliares (opcional)</span>
          <Controller
            control={control}
            name="assistantTeacherIds"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {teachers
                  .filter((t) => t.id !== responsibleTeacherId)
                  .map((teacher) => {
                    const checked = field.value.includes(teacher.id);
                    return (
                      <label
                        key={teacher.id}
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
                                ? field.value.filter((v) => v !== teacher.id)
                                : [...field.value, teacher.id],
                            );
                          }}
                        />
                        {teacher.fullName}
                      </label>
                    );
                  })}
              </div>
            )}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/turmas')}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Save className="h-4 w-4" />
          {isEditing ? 'Salvar alterações' : 'Cadastrar turma'}
        </Button>
      </div>
    </form>
  );
}
