import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, User } from 'lucide-react';
import * as studentsService from '../../services/students';
import { Student, StudentStatus } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const statusTone: Record<StudentStatus, 'success' | 'neutral' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  LOCKED: 'warning',
};

const statusLabel: Record<StudentStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  LOCKED: 'Trancado',
};

const levelLabel = { BEGINNER: 'Iniciante', INTERMEDIATE: 'Intermediário', ADVANCED: 'Avançado' };

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

export function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    studentsService
      .getStudent(id)
      .then((res) => setStudent(res.data))
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o aluno.');
        navigate('/alunos');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!student) return;
    setIsDeleting(true);
    try {
      await studentsService.deleteStudent(student.id);
      showSuccess('Aluno excluído com sucesso.');
      navigate('/alunos');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir o aluno.');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="flex flex-col gap-4">
      <Link to="/alunos" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Voltar para alunos
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">{student.fullName}</h2>
              {student.socialName && <p className="text-sm text-gray-500">Nome social: {student.socialName}</p>}
              <Badge tone={statusTone[student.status]}>{statusLabel[student.status]}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/alunos/${student.id}/editar`}>
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
          <InfoRow label="Data de nascimento" value={formatDate(student.birthDate)} />
          <InfoRow label="CPF / Documento" value={student.document ?? ''} />
          <InfoRow label="Telefone" value={student.phone ?? ''} />
          <InfoRow label="WhatsApp" value={student.whatsapp ?? ''} />
          <InfoRow label="E-mail" value={student.email ?? ''} />
          <InfoRow label="Endereço" value={student.address ?? ''} />
          <InfoRow label="Cidade" value={student.city ?? ''} />
          <InfoRow label="Estado" value={student.state ?? ''} />
          <InfoRow label="Instrumento / Curso" value={student.instrument?.name ?? ''} />
          <InfoRow label="Nível musical" value={levelLabel[student.level]} />
          <InfoRow label="Professor responsável" value={student.teacher?.fullName ?? ''} />
          <InfoRow label="Data de matrícula" value={formatDate(student.enrollmentDate)} />
          <InfoRow label="Cadastrado em" value={formatDate(student.createdAt)} />
          <InfoRow label="Última atualização" value={formatDate(student.updatedAt)} />
        </dl>

        {student.notes && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <dt className="mb-1 text-xs font-medium uppercase text-gray-400">Observações</dt>
            <dd className="whitespace-pre-wrap text-sm text-ink">{student.notes}</dd>
          </div>
        )}
      </div>

      {isConfirmingDelete && (
        <ConfirmDialog
          title="Excluir aluno"
          message={`Tem certeza de que deseja excluir "${student.fullName}"? Esta ação não poderá ser desfeita.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
