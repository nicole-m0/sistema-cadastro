import { useEffect, useState } from 'react';
import * as instrumentsService from '../services/instruments';
import { Instrument } from '../types';

export function useInstruments(options: { onlyActive?: boolean } = {}) {
  const { onlyActive = false } = options;
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    instrumentsService
      .listInstruments({ page: 1, pageSize: 100, status: onlyActive ? 'ACTIVE' : '' })
      .then((res) => setInstruments(res.items))
      .catch(() => setInstruments([]))
      .finally(() => setIsLoading(false));
  }, [onlyActive]);

  return { instruments, isLoading };
}
