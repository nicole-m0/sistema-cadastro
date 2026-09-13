import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function usePageTitle() {
  const { pathname } = useLocation();
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/alunos')) return 'Alunos';
  if (pathname.startsWith('/professores')) return 'Professores';
  if (pathname.startsWith('/instrumentos')) return 'Instrumentos';
  if (pathname.startsWith('/projetos')) return 'Projetos';
  if (pathname.startsWith('/turmas')) return 'Turmas';
  if (pathname.startsWith('/chamadas/relatorio')) return 'Relatório de Frequência';
  if (pathname.startsWith('/chamadas')) return 'Chamadas';
  return 'Associação Asafe';
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const title = usePageTitle();
  const { admin, signOut } = useAuth();
  const { showSuccess, showError } = useToast();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleConfirmLogout() {
    setIsSigningOut(true);
    try {
      await signOut();
      showSuccess('Sessão encerrada com sucesso.');
    } catch {
      showError('Não foi possível encerrar a sessão. Tente novamente.');
    } finally {
      setIsSigningOut(false);
      setConfirmingLogout(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 text-gold-800">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink">{admin?.name}</span>
        </div>
        <button
          type="button"
          onClick={() => setConfirmingLogout(true)}
          title="Sair"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-ink hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>

      {confirmingLogout && (
        <ConfirmDialog
          title="Encerrar sessão"
          message="Tem certeza de que deseja sair do painel administrativo?"
          confirmLabel="Sair"
          isLoading={isSigningOut}
          onConfirm={handleConfirmLogout}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </header>
  );
}
