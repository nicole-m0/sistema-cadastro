import { useEffect, useState } from 'react';
import * as instrumentsService from '../services/instruments';
import { Instrument } from '../types';

export function useInstruments() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    instrumentsService
      .listInstruments()
      .then((res) => setInstruments(res.data))
      .catch(() => setInstruments([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { instruments, isLoading };
}
