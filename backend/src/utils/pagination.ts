export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function normalizePagination(query: PaginationQuery) {
  const page = Math.max(DEFAULT_PAGE, Number(query.page) || DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE),
  );
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
