import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as classGroupsService from '../../services/classGroups';
import * as attendanceService from '../../services/attendance';
import { AttendanceStatus, ClassGroup, Enrollment } from '../../types';
import { InputField, SelectField, TextareaField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const statusOptions: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: 'Presente' },
  { value: 'ABSENT', label: 'Ausente' },
  { value: 'JUSTIFIED', label: 'Justificado' },
  { value: 'LATE', label: 'Atrasado' },
];

interface RosterRow {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note: string;
}

function todayIso() {
  return new Date().toISOString().substring(0, 10);
}

export function AttendanceForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [classGroupId, setClassGroupId] = useState(searchParams.get('classGroupId') ?? '');
  const [date, setDate] = useState(todayIso());
  const [generalNotes, setGeneralNotes] = useState('');
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClassGroup = useMemo(
    () => classGroups.find((c) => c.id === classGroupId) ?? null,
    [classGroups, classGroupId],
  );

  useEffect(() => {
    classGroupsService
      .listClassGroups({ page: 1, pageSize: 100, projectId: searchParams.get('projectId') ?? undefined })
      .then((res) => setClassGroups(res.items))
      .catch(() => setClassGroups([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    attendanceService
      .getAttendanceSession(id)
      .then((res) => {
        const session = res.data;
        setClassGroupId(session.classGroupId);
        setDate(session.date.substring(0, 10));
        setGeneralNotes(session.generalNotes ?? '');
        setRoster(
          session.records.map((r) => ({
            studentId: r.studentId,
            studentName: r.student.fullName,
            status: r.status,
            note: r.note ?? '',
          })),
        );
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar a chamada.');
        navigate('/chamadas');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isEditing || !classGroupId) return;
    setIsLoadingRoster(true);
    classGroupsService
      .listClassGroupStudents(classGroupId)
      .then((res: { data: Enrollment[] }) => {
        setRoster(
          res.data.map((e) => ({
            studentId: e.studentId,
            studentName: e.student.fullName,
            status: 'PRESENT' as AttendanceStatus,
            note: '',
          })),
        );
      })
      .catch(() => setRoster([]))
      .finally(() => setIsLoadingRoster(false));
  }, [classGroupId, isEditing]);

  function updateRosterRow(studentId: string, patch: Partial<RosterRow>) {
    setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    if (!classGroupId) {
      showError('Selecione uma turma.');
      return;
    }
    if (roster.length === 0) {
      showError('Não há alunos matriculados nesta turma para registrar a chamada.');
      return;
    }

    setIsSubmitting(true);
    try {
      const records = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        note: r.note || undefined,
      }));

      if (isEditing && id) {
        await attendanceService.updateAttendanceSession(id, { generalNotes: generalNotes || undefined, records });
        showSuccess('Chamada atualizada com sucesso.');
      } else {
        await attendanceService.createAttendanceSession({
          classGroupId,
          date,
          generalNotes: generalNotes || undefined,
          records,
        });
        showSuccess('Chamada registrada com sucesso.');
      }
      navigate('/chamadas');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível salvar a chamada.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/chamadas" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Voltar para chamadas
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">
          {isEditing ? 'Editar chamada' : 'Nova chamada'}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Turma"
            required
            disabled={isEditing}
            value={classGroupId}
            onChange={(e) => setClassGroupId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {classGroups.map((cg) => (
              <option key={cg.id} value={cg.id}>
                {cg.project.name} — {cg.name}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Data da aula"
            type="date"
            required
            disabled={isEditing}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {selectedClassGroup && (
          <p className="mt-2 text-sm text-gray-500">
            Instrumento: {selectedClassGroup.instrument.name} · Capacidade: {selectedClassGroup.capacity ?? '—'}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Lista de presença</h2>
        {isLoadingRoster ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : roster.length === 0 ? (
          <p className="text-sm text-gray-400">
            {classGroupId
              ? 'Nenhum aluno matriculado nesta turma.'
              : 'Selecione uma turma para carregar os alunos matriculados.'}
          </p>
        ) : (
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Aluno</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roster.map((row) => (
                  <tr key={row.studentId}>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-ink">{row.studentName}</td>
                    <td className="px-3 py-2">
                      <select
                        value={row.status}
                        onChange={(e) =>
                          updateRosterRow(row.studentId, { status: e.target.value as AttendanceStatus })
                        }
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) => updateRosterRow(row.studentId, { note: e.target.value })}
                        placeholder="Observação individual (opcional)"
                        className="w-full min-w-[200px] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <TextareaField
            label="Observação geral da aula"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/chamadas')}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} isLoading={isSubmitting}>
          <Save className="h-4 w-4" />
          Salvar chamada
        </Button>
      </div>
    </div>
  );
}
