import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import * as classGroupsService from '../../services/classGroups';
import { useProjects } from '../../hooks/useProjects';
import { ClassGroup, ClassGroupStatus } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const statusTone: Record<ClassGroupStatus, 'success' | 'neutral' | 'warning'> = {
  ACTIVE: 'success',
  CLOSED: 'neutral',
  SUSPENDED: 'warning',
};

const statusLabel: Record<ClassGroupStatus, string> = {
  ACTIVE: 'Ativa',
  CLOSED: 'Encerrada',
  SUSPENDED: 'Suspensa',
};

const weekdayLabel: Record<string, string> = {
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export function ClassGroupsList() {
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClassGroupStatus | ''>('');
  const [projectId, setProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingClassGroup, setDeletingClassGroup] = useState<ClassGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { projects } = useProjects();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setIsLoading(true);
    classGroupsService
      .listClassGroups({ page, pageSize: 10, search: debouncedSearch, status, projectId })
      .then((res) => {
        setClassGroups(res.items);
        setMeta(res.meta);
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar as turmas.');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, status, projectId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, projectId]);

  async function handleDelete() {
    if (!deletingClassGroup) return;
    setIsDeleting(true);
    try {
      await classGroupsService.deleteClassGroup(deletingClassGroup.id);
      showSuccess('Turma excluída com sucesso.');
      setDeletingClassGroup(null);
      setClassGroups((prev) => prev.filter((c) => c.id !== deletingClassGroup.id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir a turma.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, sala..."
            aria-label="Buscar turmas"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Filtrar por projeto"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          >
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClassGroupStatus | '')}
            aria-label="Filtrar por status"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativa</option>
            <option value="CLOSED">Encerrada</option>
            <option value="SUSPENDED">Suspensa</option>
          </select>
          <Link to="/turmas/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Nova turma
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : classGroups.length === 0 ? (
          <EmptyState
            title="Nenhuma turma encontrada"
            description="Ajuste os filtros ou cadastre uma nova turma para começar."
            icon={<CalendarDays className="h-6 w-6" aria-hidden="true" />}
            action={
              <Link to="/turmas/novo">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" />
                  Cadastrar turma
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-scroll overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Turma</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Projeto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Instrumento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Horário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classGroups.map((cg) => (
                    <tr key={cg.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-ink">{cg.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{cg.project.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{cg.instrument.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {weekdayLabel[cg.weekday]} {cg.startTime}
                        {cg.endTime ? `–${cg.endTime}` : ''}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone[cg.status]}>{statusLabel[cg.status]}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/turmas/${cg.id}`}
                            title="Ver detalhes"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-ink"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/turmas/${cg.id}/editar`}
                            title="Editar turma"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-ink"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            title="Excluir turma"
                            onClick={() => setDeletingClassGroup(cg)}
                            className="rounded p-1.5 text-garnet-600 hover:bg-garnet-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {deletingClassGroup && (
        <ConfirmDialog
          title="Excluir turma"
          message={`Tem certeza de que deseja excluir "${deletingClassGroup.name}"? O histórico de matrículas e chamadas será preservado.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingClassGroup(null)}
        />
      )}
    </div>
  );
}
