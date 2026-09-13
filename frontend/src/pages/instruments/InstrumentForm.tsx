import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import * as instrumentsService from '../../services/instruments';
import { InputField, SelectField, TextareaField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const instrumentFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do instrumento (mínimo 2 caracteres).'),
  description: z.preprocess(emptyToUndefined, z.string().optional()),
  displayOrder: z.coerce.number().int().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type InstrumentFormData = z.infer<typeof instrumentFormSchema>;

export function InstrumentForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [isLoadingInstrument, setIsLoadingInstrument] = useState(isEditing);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InstrumentFormData>({
    resolver: zodResolver(instrumentFormSchema),
    defaultValues: { status: 'ACTIVE', displayOrder: 0 },
  });

  useEffect(() => {
    if (!id) return;
    instrumentsService
      .getInstrument(id)
      .then((res) => {
        const i = res.data;
        reset({
          name: i.name,
          description: i.description ?? undefined,
          displayOrder: i.displayOrder,
          status: i.status,
        });
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o instrumento.');
        navigate('/instrumentos');
      })
      .finally(() => setIsLoadingInstrument(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(data: InstrumentFormData) {
    try {
      if (isEditing && id) {
        await instrumentsService.updateInstrument(id, data);
        showSuccess('Instrumento atualizado com sucesso.');
      } else {
        await instrumentsService.createInstrument(data);
        showSuccess('Instrumento cadastrado com sucesso.');
      }
      navigate('/instrumentos');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível salvar o instrumento.');
    }
  }

  if (isLoadingInstrument) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Dados do instrumento</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Nome" required error={errors.name?.message} {...register('name')} />
          <InputField
            label="Ordem de exibição"
            type="number"
            error={errors.displayOrder?.message}
            {...register('displayOrder')}
          />
          <SelectField label="Status" required error={errors.status?.message} {...register('status')}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </SelectField>
        </div>
        <div className="mt-4">
          <TextareaField label="Descrição" error={errors.description?.message} {...register('description')} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/instrumentos')}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Save className="h-4 w-4" />
          {isEditing ? 'Salvar alterações' : 'Cadastrar instrumento'}
        </Button>
      </div>
    </form>
  );
}
