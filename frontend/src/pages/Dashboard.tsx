import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, UserCheck, UserCog, Plus, User } from 'lucide-react';
import * as dashboardService from '../services/dashboard';
import { DashboardSummary } from '../types';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { isApiError } from '../context/AuthContext';

const studentStatusTone = { ACTIVE: 'success', INACTIVE: 'neutral', LOCKED: 'warning' } as const;
const teacherStatusTone = { ACTIVE: 'success', INACTIVE: 'neutral' } as const;
const studentStatusLabel = { ACTIVE: 'Ativo', INACTIVE: 'Inativo', LOCKED: 'Trancado' } as const;
const teacherStatusLabel = { ACTIVE: 'Ativo', INACTIVE: 'Inativo' } as const;

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: 'gold' | 'garnet' | 'forest' | 'amethyst';
}) {
  const toneClasses = {
    gold: 'bg-gold-50 text-gold-700',
    garnet: 'bg-garnet-50 text-garnet-700',
    forest: 'bg-forest-50 text-forest-700',
    amethyst: 'bg-amethyst-50 text-amethyst-700',
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <div className={`rounded-full p-3 ${toneClasses[tone]}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function RecentList({
  title,
  items,
  emptyMessage,
  getStatusLabel,
  getStatusTone,
  viewAllHref,
}: {
  title: string;
  items: DashboardSummary['recent']['students'] | DashboardSummary['recent']['teachers'];
  emptyMessage: string;
  getStatusLabel: (status: string) => string;
  getStatusTone: (status: string) => 'success' | 'neutral' | 'warning';
  viewAllHref: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <Link to={viewAllHref} className="text-sm font-medium text-garnet-600 hover:underline">
          Ver todos
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <span className="flex-1 truncate text-sm font-medium text-ink">{item.fullName}</span>
              <Badge tone={getStatusTone(item.status)}>{getStatusLabel(item.status)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    dashboardService
      .getDashboardSummary()
      .then((res) => setSummary(res.data))
      .catch((err) => {
        const message = isApiError(err) ? err.message : 'Não foi possível carregar o dashboard.';
        setError(message);
        showError(message);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <EmptyState
        title="Não foi possível carregar o dashboard"
        description={error ?? 'Tente novamente em instantes.'}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label="Total de alunos" value={summary.totals.students} tone="garnet" />
        <StatCard icon={UserCheck} label="Alunos ativos" value={summary.totals.activeStudents} tone="forest" />
        <StatCard icon={Users} label="Total de professores" value={summary.totals.teachers} tone="gold" />
        <StatCard icon={UserCog} label="Professores ativos" value={summary.totals.activeTeachers} tone="amethyst" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/alunos/novo"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-garnet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-garnet-700"
        >
          <Plus className="h-4 w-4" />
          Cadastrar aluno
        </Link>
        <Link
          to="/professores/novo"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-garnet-300 bg-white px-4 py-2.5 text-sm font-semibold text-garnet-700 hover:bg-garnet-50"
        >
          <Plus className="h-4 w-4" />
          Cadastrar professor
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentList
          title="Alunos recentes"
          items={summary.recent.students}
          emptyMessage="Nenhum aluno cadastrado ainda."
          getStatusLabel={(s) => studentStatusLabel[s as keyof typeof studentStatusLabel]}
          getStatusTone={(s) => studentStatusTone[s as keyof typeof studentStatusTone]}
          viewAllHref="/alunos"
        />
        <RecentList
          title="Professores recentes"
          items={summary.recent.teachers}
          emptyMessage="Nenhum professor cadastrado ainda."
          getStatusLabel={(s) => teacherStatusLabel[s as keyof typeof teacherStatusLabel]}
          getStatusTone={(s) => teacherStatusTone[s as keyof typeof teacherStatusTone]}
          viewAllHref="/professores"
        />
      </div>
    </div>
  );
}
