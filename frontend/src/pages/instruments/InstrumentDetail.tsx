import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Music2, Pencil, Trash2 } from 'lucide-react';
import * as instrumentsService from '../../services/instruments';
import { InstrumentDetail as InstrumentDetailType, InstrumentStatus } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const statusTone: Record<InstrumentStatus, 'success' | 'neutral'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

const statusLabel: Record<InstrumentStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

export function InstrumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [instrument, setInstrument] = useState<InstrumentDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    instrumentsService
      .getInstrument(id)
      .then((res) => setInstrument(res.data))
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o instrumento.');
        navigate('/instrumentos');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!instrument) return;
    setIsDeleting(true);
    try {
      await instrumentsService.deleteInstrument(instrument.id);
      showSuccess('Instrumento excluído com sucesso.');
      navigate('/instrumentos');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir o instrumento.');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!instrument) return null;

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/instrumentos"
        className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para instrumentos
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              <Music2 className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">{instrument.name}</h2>
              <Badge tone={statusTone[instrument.status]}>{statusLabel[instrument.status]}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/instrumentos/${instrument.id}/editar`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setIsConfirmingDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Descrição" value={instrument.description ?? ''} />
          <InfoRow label="Ordem de exibição" value={String(instrument.displayOrder)} />
          <InfoRow label="Alunos vinculados" value={String(instrument.usage.studentsCount)} />
          <InfoRow label="Professores vinculados" value={String(instrument.usage.teachersCount)} />
        </dl>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <h3 className="mb-3 text-base font-semibold text-ink">Projetos que usam este instrumento</h3>
        {instrument.usage.projects.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum projeto utiliza este instrumento no momento.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {instrument.usage.projects.map((project) => (
              <li key={project.id} className="py-2 text-sm">
                <Link to={`/projetos/${project.id}`} className="font-medium text-garnet-600 hover:underline">
                  {project.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <h3 className="mb-3 text-base font-semibold text-ink">Turmas que usam este instrumento</h3>
        {instrument.usage.classGroups.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma turma utiliza este instrumento no momento.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {instrument.usage.classGroups.map((classGroup) => (
              <li key={classGroup.id} className="py-2 text-sm">
                <Link to={`/turmas/${classGroup.id}`} className="font-medium text-garnet-600 hover:underline">
                  {classGroup.name}
                </Link>
                <span className="text-gray-400"> — {classGroup.project.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isConfirmingDelete && (
        <ConfirmDialog
          title="Excluir instrumento"
          message={`Tem certeza de que deseja excluir "${instrument.name}"? Só é possível excluir instrumentos sem vínculos com alunos, professores, projetos ou turmas.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
