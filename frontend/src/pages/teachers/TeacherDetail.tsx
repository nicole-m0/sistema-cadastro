import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, User } from 'lucide-react';
import * as teachersService from '../../services/teachers';
import { Teacher, TeacherStatus } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../context/AuthContext';

const statusTone: Record<TeacherStatus, 'success' | 'neutral'> = { ACTIVE: 'success', INACTIVE: 'neutral' };
const statusLabel: Record<TeacherStatus, string> = { ACTIVE: 'Ativo', INACTIVE: 'Inativo' };

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

export function TeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    teachersService
      .getTeacher(id)
      .then((res) => setTeacher(res.data))
      .catch((err) => {
        showError(isApiError(err) ? err.message : 'Não foi possível carregar o professor.');
        navigate('/professores');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!teacher) return;
    setIsDeleting(true);
    try {
      await teachersService.deleteTeacher(teacher.id);
      showSuccess('Professor excluído com sucesso.');
      navigate('/professores');
    } catch (err) {
      showError(isApiError(err) ? err.message : 'Não foi possível excluir o professor.');
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

  if (!teacher) return null;

  return (
    <div className="flex flex-col gap-4">
      <Link to="/professores" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Voltar para professores
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              {teacher.photoUrl ? (
                <img src={teacher.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">{teacher.fullName}</h2>
              {teacher.socialName && <p className="text-sm text-gray-500">Nome social: {teacher.socialName}</p>}
              <Badge tone={statusTone[teacher.status]}>{statusLabel[teacher.status]}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/professores/${teacher.id}/editar`}>
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
          <InfoRow label="CPF / Documento" value={teacher.document ?? ''} />
          <InfoRow label="Telefone" value={teacher.phone ?? ''} />
          <InfoRow label="WhatsApp" value={teacher.whatsapp ?? ''} />
          <InfoRow label="E-mail" value={teacher.email ?? ''} />
          <InfoRow label="Endereço" value={teacher.address ?? ''} />
          <InfoRow label="Especialidade" value={teacher.specialty ?? ''} />
          <InfoRow
            label="Instrumentos que leciona"
            value={teacher.instruments.map((i) => i.name).join(', ')}
          />
          <InfoRow label="Alunos vinculados" value={String(teacher.studentsCount)} />
          <InfoRow label="Data de contratação" value={formatDate(teacher.hireDate)} />
          <InfoRow label="Cadastrado em" value={formatDate(teacher.createdAt)} />
          <InfoRow label="Última atualização" value={formatDate(teacher.updatedAt)} />
        </dl>

        {teacher.bio && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <dt className="mb-1 text-xs font-medium uppercase text-gray-400">Biografia / Observações</dt>
            <dd className="whitespace-pre-wrap text-sm text-ink">{teacher.bio}</dd>
          </div>
        )}
      </div>

      {isConfirmingDelete && (
        <ConfirmDialog
          title="Excluir professor"
          message={`Tem certeza de que deseja excluir "${teacher.fullName}"? Esta ação não poderá ser desfeita.`}
          confirmLabel="Excluir"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
