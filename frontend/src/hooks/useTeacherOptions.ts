import { useEffect, useState } from 'react';
import * as teachersService from '../services/teachers';
import { Teacher } from '../types';

export function useTeacherOptions() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    teachersService
      .listTeachers({ page: 1, pageSize: 100 })
      .then((res) => setTeachers(res.items))
      .catch(() => setTeachers([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { teachers, isLoading };
}
