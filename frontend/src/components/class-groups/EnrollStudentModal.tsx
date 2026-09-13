import { useEffect, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import * as studentsService from '../../services/students';
import { Student } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';

export function EnrollStudentModal({
  excludeStudentIds,
  onClose,
  onSelect,
}: {
  excludeStudentIds: string[];
  onClose: () => void;
  onSelect: (student: Student) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setIsLoading(true);
    studentsService
      .listStudents({ page: 1, pageSize: 20, search: debouncedSearch, status: 'ACTIVE' })
      .then((res) => setStudents(res.items))
      .catch(() => setStudents([]))
      .finally(() => setIsLoading(false));
  }, [debouncedSearch]);

  const excluded = new Set(excludeStudentIds);
  const availableStudents = students.filter((s) => !excluded.has(s.id));

  async function handleSelect(student: Student) {
    setEnrollingId(student.id);
    try {
      await onSelect(student);
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <Modal title="Matricular aluno" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aluno por nome..."
            aria-label="Buscar aluno"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
          />
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : availableStudents.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhum aluno disponível para matricular com esse filtro.
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
            {availableStudents.map((student) => (
              <li key={student.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-ink">{student.fullName}</span>
                <Button
                  variant="secondary"
                  onClick={() => handleSelect(student)}
                  isLoading={enrollingId === student.id}
                >
                  <UserPlus className="h-4 w-4" />
                  Matricular
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
