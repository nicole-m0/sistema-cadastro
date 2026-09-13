import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ClipboardCheck, History, Pencil, Plus, Trash2, UserMinus } from 'lucide-react';
import * as classGroupsService from '../../services/classGroups';
import { useTeacherOptions } from '../../hooks/useTeacherOptions';
import { ClassGroup, ClassGroupStatus, Enrollment } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SelectField } from '../../components/ui/Field';
import { EnrollStudentModal } from '../../components/class-groups/EnrollStudentModal';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const statusTone: Record<ClassGroupStatus, 'success' | 'neutral' | 'warning'> = {
  ACTIVE: 'success',
  CLOSED: 'neutral',
  SUSPENDED: 'warning',
};

const statusLabel: Record<ClassGroupStatus, string> = {
  ACTIVE: 'Ativa',
  CLOSED: 'Encerrada',
  SUSPENDED: 'Suspensa',
};

const weekdayLabel: Record<string, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

export function ClassGroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { teachers } = useTeacherOptions();

  const [classGroup, setClassGroup] = useState<ClassGroup | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [isAddingAssistant, setIsAddingAssistant] = useState(false);
  const [removingTeacherId, setRemovingTeacherId] = useState<string | null>(null);
  const [selectedNewResponsibleId, setSelectedNewResponsibleId] = useState('');
  const [isChangingResponsible, setIsChangingResponsible] = useState(false);

  function loadClassGroup() {
    if (!id) return Promise.resolve();
    return Promise.all([
      classGroupsService.getClassGroup(id),
      classGroupsService.listClassGroupStudents(id),
    ])
      .then(([cgRes, enrollmentsRes]) => {
        setClassGroup(cgRes.data);
        setEnrollments(enrollmentsRes.data);
      })
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar a turma.');
        navigate('/turmas');
      });
  }

  useEffect(() => {
    setIsLoading(true);
    Promise.resolve(loadClassGroup()).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!classGroup) return;
    setIsDeleting(true);
    try {
      await classGroupsService.deleteClassGroup(classGroup.id);
      showSuccess('Turma excluída com sucesso.');
      navigate('/turmas');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir a turma.');
      setIsDeleting(false);
    }
  }

  async function handleRemoveStudent(studentId: string) {
    if (!classGroup) return;
    setRemovingStudentId(studentId);
    try {
      await classGroupsService.removeEnrollment(classGroup.id, studentId);
      showSuccess('Aluno removido da turma.');
      await loadClassGroup();
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível remover o aluno.');
    } finally {
      setRemovingStudentId(null);
    }
  }

  async function handleRemoveAssistant(teacherId: string) {
    if (!classGroup) return;
    setRemovingTeacherId(teacherId);
    try {
      await classGroupsService.unlinkTeacher(classGroup.id, teacherId);
      showSuccess('Professor removido da turma.');
      await loadClassGroup();
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível remover o professor.');
    } finally {
      setRemovingTeacherId(null);
    }
  }

  async function handleAddAssistant() {
    if (!classGroup || !selectedAssistantId) return;
    setIsAddingAssistant(true);
    try {
      await classGroupsService.linkTeacher(classGroup.id, selectedAssistantId, 'ASSISTANT');
      showSuccess('Professor auxiliar vinculado à turma.');
      setSelectedAssistantId('');
      await loadClassGroup();
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível vincular o professor.');
    } finally {
      setIsAddingAssistant(false);
    }
  }

  async function handleChangeResponsible() {
    if (!classGroup || !selectedNewResponsibleId) return;
    setIsChangingResponsible(true);
    try {
      await classGroupsService.linkTeacher(classGroup.id, selectedNewResponsibleId, 'RESPONSIBLE');
      showSuccess('Professor responsável atualizado.');
      setSelectedNewResponsibleId('');
      await loadClassGroup();
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível trocar o professor responsável.');
    } finally {
      setIsChangingResponsible(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!classGroup) return null;

  const responsible = classGroup.teachers.find((t) => t.role === 'RESPONSIBLE');
  const assistants = classGroup.teachers.filter((t) => t.role === 'ASSISTANT');
  const linkedTeacherIds = new Set(classGroup.teachers.map((t) => t.id));
  const availableAssistants = teachers.filter((t) => !linkedTeacherIds.has(t.id));
  const availableNewResponsibles = teachers.filter((t) => t.id !== responsible?.id);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/turmas" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Voltar para turmas
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              <CalendarDays className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">{classGroup.name}</h2>
              <Link to={`/projetos/${classGroup.project.id}`} className="text-sm text-garnet-600 hover:underline">
                {classGroup.project.name}
              </Link>
              <div className="mt-1">
                <Badge tone={statusTone[classGroup.status]}>{statusLabel[classGroup.status]}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/chamadas/nova?classGroupId=${classGroup.id}`}>
              <Button variant="secondary">
                <ClipboardCheck className="h-4 w-4" />
                Nova chamada
              </Button>
            </Link>
            <Link to={`/chamadas?classGroupId=${classGroup.id}`}>
              <Button variant="secondary">
                <History className="h-4 w-4" />
                Histórico
              </Button>
            </Link>
            <Link to={`/turmas/${classGroup.id}/editar`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setIsConfirmingDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Instrumento" value={classGroup.instrument.name} />
          <InfoRow label="Dia da semana" value={weekdayLabel[classGroup.weekday]} />
          <InfoRow
            label="Horário"
            value={classGroup.endTime ? `${classGroup.startTime} – ${classGroup.endTime}` : classGroup.startTime}
          />
          <InfoRow label="Sala / Local" value={classGroup.room ?? ''} />
          <InfoRow label="Capacidade máxima" value={classGroup.capacity ? String(classGroup.capacity) : ''} />
          <InfoRow label="Alunos matriculados" value={String(classGroup.studentsCount)} />
        </dl>

        {classGroup.notes && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <dt className="mb-1 text-xs font-medium uppercase text-gray-400">Observações</dt>
            <dd className="whitespace-pre-wrap text-sm text-ink">{classGroup.notes}</dd>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <h3 className="mb-3 text-base font-semibold text-ink">Professor responsável</h3>
        <p className="mb-4 text-sm text-ink">{responsible?.fullName ?? 'Nenhum professor responsável definido.'}</p>
        {availableNewResponsibles.length > 0 && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px]">
              <SelectField
                label="Trocar responsável"
                value={selectedNewResponsibleId}
                onChange={(e) => setSelectedNewResponsibleId(e.target.value)}
              >
                <option value="">Selecione um professor...</option>
                {availableNewResponsibles.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button
              variant="secondary"
              onClick={handleChangeResponsible}
              isLoading={isChangingResponsible}
              disabled={!selectedNewResponsibleId}
            >
              Trocar
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <h3 className="mb-3 text-base font-semibold text-ink">Professores auxiliares</h3>
        <div className="flex flex-wrap gap-2">
          {assistants.length === 0 && <p className="text-sm text-gray-400">Nenhum professor auxiliar vinculado.</p>}
          {assistants.map((teacher) => (
            <span
              key={teacher.id}
              className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              {teacher.fullName}
              <button
                type="button"
                title="Remover professor auxiliar"
                onClick={() => handleRemoveAssistant(teacher.id)}
                disabled={removingTeacherId === teacher.id}
                className="rounded-full p-0.5 text-garnet-600 hover:bg-garnet-50 disabled:opacity-50"
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        {availableAssistants.length > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[200px]">
              <SelectField
                label="Adicionar professor auxiliar"
                value={selectedAssistantId}
                onChange={(e) => setSelectedAssistantId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {availableAssistants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button
              variant="secondary"
              onClick={handleAddAssistant}
              isLoading={isAddingAssistant}
              disabled={!selectedAssistantId}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Alunos matriculados</h3>
          <Button variant="secondary" onClick={() => setIsEnrollModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Matricular aluno
          </Button>
        </div>
        {enrollments.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum aluno matriculado nesta turma ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {enrollments.map((enrollment) => (
              <li key={enrollment.id} className="flex items-center justify-between py-2">
                <Link
                  to={`/alunos/${enrollment.student.id}`}
                  className="text-sm font-medium text-ink hover:text-garnet-600 hover:underline"
                >
                  {enrollment.student.fullName}
                </Link>
                <button
                  type="button"
                  title="Remover aluno da turma"
                  onClick={() => handleRemoveStudent(enrollment.studentId)}
                  disabled={removingStudentId === enrollment.studentId}
                  className="rounded p-1.5 text-garnet-600 hover:bg-garnet-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isEnrollModalOpen && (
        <EnrollStudentModal
          excludeStudentIds={enrollments.map((e) => e.studentId)}
          onClose={() => setIsEnrollModalOpen(false)}
          onSelect={async (student) => {
            try {
              await classGroupsService.enrollStudent(classGroup.id, student.id);
              showSuccess(`${student.fullName} matriculado(a) com sucesso.`);
              await loadClassGroup();
              setIsEnrollModalOpen(false);
            } catch (err) {
              showError(isApiError(err) ? err.message : 'Não foi possível matricular o aluno.');
            }
          }}
        />
      )}

      {isConfirmingDelete && (
        <ConfirmDialog
          title="Excluir turma"
          message={`Tem certeza de que deseja excluir "${classGroup.name}"? O histórico de matrículas e chamadas será preservado.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
