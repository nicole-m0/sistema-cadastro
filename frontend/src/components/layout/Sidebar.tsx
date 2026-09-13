import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Music2,
  FolderKanban,
  CalendarDays,
  ClipboardCheck,
  X,
} from 'lucide-react';
import logo from '../../assets/logo-asafe.png';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/alunos', label: 'Alunos', icon: GraduationCap, end: false },
  { to: '/professores', label: 'Professores', icon: Users, end: false },
  { to: '/instrumentos', label: 'Instrumentos', icon: Music2, end: false },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban, end: false },
  { to: '/turmas', label: 'Turmas', icon: CalendarDays, end: false },
  { to: '/chamadas', label: 'Chamadas', icon: ClipboardCheck, end: false },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu de navegação principal"
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo da Associação Asafe"
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold text-garnet-700">Associação Asafe</p>
              <p className="text-xs text-gray-500">Painel Administrativo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-garnet-600 text-white'
                    : 'text-ink hover:bg-gold-50 hover:text-garnet-700'
                }`
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-400">
          Associação Amor e Fé © {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
