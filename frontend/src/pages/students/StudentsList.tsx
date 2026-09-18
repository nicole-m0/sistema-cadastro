import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, User } from 'lucide-react';
import * as studentsService from '../../services/students';
import { Student, StudentStatus } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { useInstruments } from '../../hooks/useInstruments';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const statusTone: Record<StudentStatus, 'success' | 'neutral' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  LOCKED: 'warning',
};

const statusLabel: Record<StudentStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  LOCKED: 'Trancado',
};

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentStatus | ''>('');
  const [instrumentId, setInstrumentId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { instruments } = useInstruments();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setIsLoading(true);
    studentsService
      .listStudents({ page, pageSize: 10, search: debouncedSearch, status, instrumentId })
      .then((res) => {
        setStudents(res.items);
        setMeta(res.meta);
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar os alunos.');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, status, instrumentId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, instrumentId]);

  async function handleDelete() {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await studentsService.deleteStudent(deletingStudent.id);
      showSuccess('Aluno excluído com sucesso.');
      setDeletingStudent(null);
      setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir o aluno.');
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
            placeholder="Buscar por nome, telefone, e-mail..."
            aria-label="Buscar alunos"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StudentStatus | '')}
            aria-label="Filtrar por status"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="LOCKED">Trancado</option>
          </select>
          <select
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
            aria-label="Filtrar por instrumento ou curso"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          >
            <option value="">Todos os instrumentos</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <Link to="/alunos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo aluno
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            title="Nenhum aluno encontrado"
            description="Ajuste os filtros ou cadastre um novo aluno para começar."
            action={
              <Link to="/alunos/novo">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" />
                  Cadastrar aluno
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
                      Aluno
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Instrumento
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Professor
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
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink">{student.fullName}</p>
                            <p className="text-xs text-gray-500">{student.email || student.phone || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {student.instrument?.name ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {student.teacher?.fullName ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone[student.status]}>{statusLabel[student.status]}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/alunos/${student.id}`}
                            title="Ver mais"
                            className="rounded px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-ink"
                          >
                            Ver mais
                          </Link>
                          <Link
                            to={`/alunos/${student.id}/editar`}
                            title="Editar aluno"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-ink"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            title="Excluir aluno"
                            onClick={() => setDeletingStudent(student)}
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

      {deletingStudent && (
        <ConfirmDialog
          title="Excluir aluno"
          message={`Tem certeza de que deseja excluir "${deletingStudent.fullName}"? Esta ação não poderá ser desfeita.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingStudent(null)}
        />
      )}
    </div>
  );
}
