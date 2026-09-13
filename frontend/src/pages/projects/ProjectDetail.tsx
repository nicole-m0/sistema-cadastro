import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, FolderKanban, Pencil, Plus, Trash2, X } from 'lucide-react';
import * as projectsService from '../../services/projects';
import { useInstruments } from '../../hooks/useInstruments';
import { ProjectDetail as ProjectDetailType, ProjectStatus } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SelectField } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const statusTone: Record<ProjectStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  PLANNING: 'warning',
  ACTIVE: 'success',
  CLOSED: 'neutral',
  ARCHIVED: 'danger',
};

const statusLabel: Record<ProjectStatus, string> = {
  PLANNING: 'Planejamento',
  ACTIVE: 'Ativo',
  CLOSED: 'Encerrado',
  ARCHIVED: 'Arquivado',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { instruments: activeInstruments } = useInstruments({ onlyActive: true });

  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedInstrumentToAdd, setSelectedInstrumentToAdd] = useState('');
  const [isLinkingInstrument, setIsLinkingInstrument] = useState(false);
  const [unlinkingInstrumentId, setUnlinkingInstrumentId] = useState<string | null>(null);

  function loadProject() {
    if (!id) return;
    return projectsService
      .getProject(id)
      .then((res) => setProject(res.data))
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o projeto.');
        navigate('/projetos');
      });
  }

  useEffect(() => {
    setIsLoading(true);
    Promise.resolve(loadProject()).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!project) return;
    setIsDeleting(true);
    try {
      await projectsService.deleteProject(project.id);
      showSuccess('Projeto excluído com sucesso.');
      navigate('/projetos');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir o projeto.');
      setIsDeleting(false);
    }
  }

  async function handleLinkInstrument() {
    if (!project || !selectedInstrumentToAdd) return;
    setIsLinkingInstrument(true);
    try {
      await projectsService.linkProjectInstrument(project.id, selectedInstrumentToAdd);
      showSuccess('Instrumento vinculado ao projeto.');
      setSelectedInstrumentToAdd('');
      await loadProject();
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível vincular o instrumento.');
    } finally {
      setIsLinkingInstrument(false);
    }
  }

  async function handleUnlinkInstrument(instrumentId: string) {
    if (!project) return;
    setUnlinkingInstrumentId(instrumentId);
    try {
      await projectsService.unlinkProjectInstrument(project.id, instrumentId);
      showSuccess('Instrumento removido do projeto.');
      await loadProject();
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível remover o instrumento.');
    } finally {
      setUnlinkingInstrumentId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) return null;

  const linkedIds = new Set(project.instruments.map((i) => i.id));
  const availableToAdd = activeInstruments.filter((i) => !linkedIds.has(i.id));

  return (
    <div className="flex flex-col gap-4">
      <Link to="/projetos" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Voltar para projetos
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              {project.imageUrl ? (
                <img src={project.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <FolderKanban className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">{project.name}</h2>
              <Badge tone={statusTone[project.status]}>{statusLabel[project.status]}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/turmas/novo?projectId=${project.id}`}>
              <Button variant="secondary">
                <Plus className="h-4 w-4" />
                Nova turma
              </Button>
            </Link>
            <Link to={`/chamadas/nova?projectId=${project.id}`}>
              <Button variant="secondary">
                <ClipboardCheck className="h-4 w-4" />
                Registrar chamada
              </Button>
            </Link>
            <Link to={`/projetos/${project.id}/editar`}>
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
          <InfoRow label="Local" value={project.location ?? ''} />
          <InfoRow label="Responsável" value={project.responsible ?? ''} />
          <InfoRow label="Data de início" value={formatDate(project.startDate)} />
          <InfoRow label="Data de término" value={formatDate(project.endDate)} />
          <InfoRow label="Turmas" value={String(project.summary.classGroupsCount)} />
          <InfoRow label="Alunos participantes" value={String(project.summary.studentsCount)} />
          <InfoRow label="Professores envolvidos" value={String(project.summary.teachersCount)} />
        </dl>

        {project.description && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <dt className="mb-1 text-xs font-medium uppercase text-gray-400">Descrição</dt>
            <dd className="whitespace-pre-wrap text-sm text-ink">{project.description}</dd>
          </div>
        )}
        {project.objective && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <dt className="mb-1 text-xs font-medium uppercase text-gray-400">Objetivo</dt>
            <dd className="whitespace-pre-wrap text-sm text-ink">{project.objective}</dd>
          </div>
        )}
        {project.notes && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <dt className="mb-1 text-xs font-medium uppercase text-gray-400">Observações</dt>
            <dd className="whitespace-pre-wrap text-sm text-ink">{project.notes}</dd>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <h3 className="mb-3 text-base font-semibold text-ink">Instrumentos vinculados</h3>
        <div className="flex flex-wrap gap-2">
          {project.instruments.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum instrumento vinculado a este projeto.</p>
          )}
          {project.instruments.map((instrument) => (
            <span
              key={instrument.id}
              className="inline-flex items-center gap-1 rounded-full border border-garnet-200 bg-garnet-50 px-3 py-1.5 text-sm font-medium text-garnet-700"
            >
              {instrument.name}
              <button
                type="button"
                title="Remover instrumento do projeto"
                onClick={() => handleUnlinkInstrument(instrument.id)}
                disabled={unlinkingInstrumentId === instrument.id}
                className="rounded-full p-0.5 hover:bg-garnet-100 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>

        {availableToAdd.length > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[200px]">
              <SelectField
                label="Adicionar instrumento"
                value={selectedInstrumentToAdd}
                onChange={(e) => setSelectedInstrumentToAdd(e.target.value)}
              >
                <option value="">Selecione um instrumento ativo...</option>
                {availableToAdd.map((instrument) => (
                  <option key={instrument.id} value={instrument.id}>
                    {instrument.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button
              variant="secondary"
              onClick={handleLinkInstrument}
              isLoading={isLinkingInstrument}
              disabled={!selectedInstrumentToAdd}
            >
              <Plus className="h-4 w-4" />
              Vincular
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Turmas do projeto</h3>
          <Link to={`/turmas/novo?projectId=${project.id}`} className="text-sm font-medium text-garnet-600 hover:underline">
            Adicionar turma
          </Link>
        </div>
        {project.classGroups.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma turma cadastrada neste projeto ainda.</p>
        ) : (
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Turma</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Instrumento</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Professor(es)</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Alunos</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {project.classGroups.map((cg) => (
                  <tr key={cg.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-ink">{cg.name}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{cg.instrument.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {cg.teachers.map((t) => t.fullName).join(', ') || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{cg.studentsCount}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <Link to={`/turmas/${cg.id}`} className="text-sm font-medium text-garnet-600 hover:underline">
                        Ver turma
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isConfirmingDelete && (
        <ConfirmDialog
          title="Excluir projeto"
          message={`Tem certeza de que deseja excluir "${project.name}"? O histórico de turmas e chamadas será preservado.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
