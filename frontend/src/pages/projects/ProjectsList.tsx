import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import * as projectsService from '../../services/projects';
import { Project, ProjectStatus } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
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

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setIsLoading(true);
    projectsService
      .listProjects({ page, pageSize: 10, search: debouncedSearch, status })
      .then((res) => {
        setProjects(res.items);
        setMeta(res.meta);
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar os projetos.');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  async function handleDelete() {
    if (!deletingProject) return;
    setIsDeleting(true);
    try {
      await projectsService.deleteProject(deletingProject.id);
      showSuccess('Projeto excluído com sucesso.');
      setDeletingProject(null);
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir o projeto.');
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
            placeholder="Buscar por nome, local, responsável..."
            aria-label="Buscar projetos"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus | '')}
            aria-label="Filtrar por status"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          >
            <option value="">Todos os status</option>
            <option value="PLANNING">Planejamento</option>
            <option value="ACTIVE">Ativo</option>
            <option value="CLOSED">Encerrado</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
          <Link to="/projetos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo projeto
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="Nenhum projeto encontrado"
            description="Ajuste os filtros ou cadastre um novo projeto para começar."
            icon={<FolderKanban className="h-6 w-6" aria-hidden="true" />}
            action={
              <Link to="/projetos/novo">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" />
                  Cadastrar projeto
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
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Projeto
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Responsável
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Turmas
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-sm font-medium text-ink">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.location || '—'}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {project.responsible || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {project.classGroupsCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone[project.status]}>{statusLabel[project.status]}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/projetos/${project.id}`}
                            title="Ver mais"
                            className="rounded px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-ink"
                          >
                            Ver mais
                          </Link>
                          <Link
                            to={`/projetos/${project.id}/editar`}
                            title="Editar projeto"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-ink"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            title="Excluir projeto"
                            onClick={() => setDeletingProject(project)}
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

      {deletingProject && (
        <ConfirmDialog
          title="Excluir projeto"
          message={`Tem certeza de que deseja excluir "${deletingProject.name}"? O histórico de turmas e chamadas será preservado.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingProject(null)}
        />
      )}
    </div>
  );
}
