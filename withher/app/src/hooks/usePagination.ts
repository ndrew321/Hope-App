import { useMemo, useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const initialPage = options.initialPage ?? 1;
  const initialPageSize = options.initialPageSize ?? 20;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPageSafe = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage));
  }, []);

  const setPageSize = useCallback((size: number) => {
    const safeSize = Math.max(1, size);
    setPageSizeState(safeSize);
    setPage(1);
  }, []);

  const nextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  return {
    page,
    pageSize,
    offset,
    setPage: setPageSafe,
    setPageSize,
    nextPage,
    prevPage,
    reset,
  };
}
