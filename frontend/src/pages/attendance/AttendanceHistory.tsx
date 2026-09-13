import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Pencil, Plus } from 'lucide-react';
import * as attendanceService from '../../services/attendance';
import { useProjects } from '../../hooks/useProjects';
import { AttendanceSessionListItem } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function AttendanceHistory() {
  const [searchParams] = useSearchParams();
  const classGroupId = searchParams.get('classGroupId') ?? '';
  const [sessions, setSessions] = useState<AttendanceSessionListItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [projectId, setProjectId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { projects } = useProjects();
  const { showError } = useToast();

  useEffect(() => {
    setIsLoading(true);
    attendanceService
      .listAttendanceSessions({ page, pageSize: 10, classGroupId: classGroupId || undefined, projectId, from, to })
      .then((res) => {
        setSessions(res.items);
        setMeta(res.meta);
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o histórico de chamadas.');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, classGroupId, projectId, from, to]);

  useEffect(() => {
    setPage(1);
  }, [classGroupId, projectId, from, to]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
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
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Data inicial"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Data final"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          />
        </div>
        <div className="flex gap-2">
          <Link to="/chamadas/relatorio">
            <Button variant="secondary">Relatório de frequência</Button>
          </Link>
          <Link to="/chamadas/nova">
            <Button>
              <Plus className="h-4 w-4" />
              Nova chamada
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            title="Nenhuma chamada encontrada"
            description="Ajuste os filtros ou registre uma nova chamada."
            icon={<ClipboardCheck className="h-6 w-6" aria-hidden="true" />}
            action={
              <Link to="/chamadas/nova">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" />
                  Registrar chamada
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Turma</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Projeto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Presença</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">{formatDate(session.date)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{session.classGroup.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {session.classGroup.project.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {session.summary.present}/{session.summary.total} presentes
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          to={`/chamadas/${session.id}/editar`}
                          title="Editar chamada"
                          className="inline-flex items-center gap-1 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
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
    </div>
  );
}
