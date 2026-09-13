import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Music2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import * as instrumentsService from '../../services/instruments';
import { Instrument, InstrumentStatus } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
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

export function InstrumentsList() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InstrumentStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingInstrument, setDeletingInstrument] = useState<Instrument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setIsLoading(true);
    instrumentsService
      .listInstruments({ page, pageSize: 10, search: debouncedSearch, status })
      .then((res) => {
        setInstruments(res.items);
        setMeta(res.meta);
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar os instrumentos.');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  async function handleDelete() {
    if (!deletingInstrument) return;
    setIsDeleting(true);
    try {
      await instrumentsService.deleteInstrument(deletingInstrument.id);
      showSuccess('Instrumento excluído com sucesso.');
      setDeletingInstrument(null);
      setInstruments((prev) => prev.filter((i) => i.id !== deletingInstrument.id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir o instrumento.');
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
            placeholder="Buscar por nome ou descrição..."
            aria-label="Buscar instrumentos"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as InstrumentStatus | '')}
            aria-label="Filtrar por status"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>
          <Link to="/instrumentos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo instrumento
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : instruments.length === 0 ? (
          <EmptyState
            title="Nenhum instrumento encontrado"
            description="Ajuste os filtros ou cadastre um novo instrumento para começar."
            icon={<Music2 className="h-6 w-6" aria-hidden="true" />}
            action={
              <Link to="/instrumentos/novo">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" />
                  Cadastrar instrumento
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
                      Instrumento
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Descrição
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
                  {instruments.map((instrument) => (
                    <tr key={instrument.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-ink">
                        {instrument.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {instrument.description || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone[instrument.status]}>{statusLabel[instrument.status]}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/instrumentos/${instrument.id}`}
                            title="Ver detalhes"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-ink"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/instrumentos/${instrument.id}/editar`}
                            title="Editar instrumento"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-ink"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            title="Excluir instrumento"
                            onClick={() => setDeletingInstrument(instrument)}
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

      {deletingInstrument && (
        <ConfirmDialog
          title="Excluir instrumento"
          message={`Tem certeza de que deseja excluir "${deletingInstrument.name}"? Só é possível excluir instrumentos sem vínculos com alunos, professores, projetos ou turmas.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingInstrument(null)}
        />
      )}
    </div>
  );
}
