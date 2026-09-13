import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import * as attendanceService from '../../services/attendance';
import * as classGroupsService from '../../services/classGroups';
import * as studentsService from '../../services/students';
import { useProjects } from '../../hooks/useProjects';
import { useInstruments } from '../../hooks/useInstruments';
import { useDebounce } from '../../hooks/useDebounce';
import { AttendanceFrequencyRow, ClassGroup, Student } from '../../types';
import { SelectField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

export function AttendanceReport() {
  const { projects } = useProjects();
  const { instruments } = useInstruments();
  const { showError } = useToast();

  const [projectId, setProjectId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');
  const [instrumentId, setInstrumentId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentMatches, setStudentMatches] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [rows, setRows] = useState<AttendanceFrequencyRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const debouncedStudentSearch = useDebounce(studentSearch, 300);

  useEffect(() => {
    if (!projectId) {
      setClassGroups([]);
      setClassGroupId('');
      return;
    }
    classGroupsService
      .listClassGroups({ page: 1, pageSize: 100, projectId })
      .then((res) => setClassGroups(res.items))
      .catch(() => setClassGroups([]));
  }, [projectId]);

  useEffect(() => {
    if (!debouncedStudentSearch || selectedStudent) {
      setStudentMatches([]);
      return;
    }
    studentsService
      .listStudents({ page: 1, pageSize: 10, search: debouncedStudentSearch })
      .then((res) => setStudentMatches(res.items))
      .catch(() => setStudentMatches([]));
  }, [debouncedStudentSearch, selectedStudent]);

  function determineScope(): { scope: 'student' | 'class-group' | 'project'; id: string } | null {
    if (selectedStudent) return { scope: 'student', id: selectedStudent.id };
    if (classGroupId) return { scope: 'class-group', id: classGroupId };
    if (projectId) return { scope: 'project', id: projectId };
    return null;
  }

  async function handleRunReport() {
    const target = determineScope();
    if (!target) {
      showError('Selecione ao menos um projeto, turma ou aluno para gerar o relatório.');
      return;
    }

    setIsLoading(true);
    const filters = { from: from || undefined, to: to || undefined, instrumentId: instrumentId || undefined, classGroupId: classGroupId || undefined };
    try {
      let result;
      if (target.scope === 'student') {
        result = await attendanceService.getStudentFrequency(target.id, filters);
      } else if (target.scope === 'class-group') {
        result = await attendanceService.getClassGroupFrequency(target.id, filters);
      } else {
        result = await attendanceService.getProjectFrequency(target.id, filters);
      }
      setRows(result.data);
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível gerar o relatório.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportCsv() {
    const target = determineScope();
    if (!target) {
      showError('Selecione ao menos um projeto, turma ou aluno para exportar o relatório.');
      return;
    }
    setIsExporting(true);
    try {
      await attendanceService.downloadFrequencyReportCsv(target.scope, target.id, {
        from: from || undefined,
        to: to || undefined,
        instrumentId: instrumentId || undefined,
        classGroupId: classGroupId || undefined,
      });
    } catch {
      showError('Não foi possível exportar o relatório em CSV.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-ink">Filtros</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField label="Projeto" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Turma"
            value={classGroupId}
            onChange={(e) => setClassGroupId(e.target.value)}
            disabled={!projectId}
            hint={!projectId ? 'Selecione um projeto para listar as turmas.' : undefined}
          >
            <option value="">Todas as turmas do projeto</option>
            {classGroups.map((cg) => (
              <option key={cg.id} value={cg.id}>
                {cg.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Instrumento" value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)}>
            <option value="">Todos os instrumentos</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </SelectField>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Aluno (opcional)</label>
            {selectedStudent ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <span className="flex-1 truncate">{selectedStudent.fullName}</span>
                <button
                  type="button"
                  className="text-xs font-medium text-garnet-600 hover:underline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentSearch('');
                  }}
                >
                  Limpar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar aluno por nome..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
                />
                {studentMatches.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-card">
                    {studentMatches.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentMatches([]);
                          }}
                        >
                          {s.fullName}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Período - de</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Período - até</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-garnet-400 focus:outline-none focus:ring-2 focus:ring-garnet-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleRunReport} isLoading={isLoading}>
            Gerar relatório
          </Button>
          <Button variant="secondary" onClick={handleExportCsv} isLoading={isExporting}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        {rows === null ? (
          <EmptyState
            title="Nenhum relatório gerado ainda"
            description="Selecione ao menos um projeto, turma ou aluno e clique em Gerar relatório."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhum dado encontrado"
            description="Não há registros de frequência para os filtros selecionados."
          />
        ) : (
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Aluno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Turma</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Projeto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Instrumento</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Aulas</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Presenças</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Faltas</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Justif.</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Atrasos</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">% Presença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={`${row.studentId}:${row.classGroupId}`}
                    className={row.attendancePercentage < 75 ? 'bg-garnet-50/40' : undefined}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">{row.studentName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{row.classGroupName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{row.projectName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{row.instrumentName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">{row.totalSessions}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">{row.present}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">{row.absent}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">{row.justified}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">{row.late}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-ink">
                      {row.attendancePercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
