import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../../types';
import { Button } from './Button';

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total, pageSize } = meta;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row">
      <p className="text-sm text-gray-500">
        Mostrando <span className="font-medium text-ink">{from}</span> a{' '}
        <span className="font-medium text-ink">{to}</span> de{' '}
        <span className="font-medium text-ink">{total}</span> registros
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-600">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
