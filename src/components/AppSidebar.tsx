import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSquadsQuery } from '@/hooks/useSquadsQuery';
import logoGrupoTG from '@/assets/logo-grupo-tg.jpg';
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'projects', label: 'Squads', icon: FolderKanban },
  { id: 'tasks', label: 'Demandas', icon: CheckSquare },
  { id: 'productivity', label: 'Produtividade', icon: BarChart3 },
  { id: 'reports', label: 'Relatórios', icon: FileText },
];

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { currentUser, logout } = useAuth();
  const { data: squads = [] } = useSquadsQuery();

  const roleLabels: Record<string, string> = {
    cs: 'CS', operacional: 'Operacional', design: 'Design', copy: 'Copy', gestao: 'Gestão',
  };

  const accessLevelConfig: Record<number, { label: string; className: string }> = {
    1: { label: 'Operacional', className: 'bg-muted text-muted-foreground' },
    2: { label: 'Tático', className: 'bg-blue-500/20 text-blue-300' },
    3: { label: 'Admin', className: 'bg-purple-500/20 text-purple-300' },
  };

  const userSquadNames = currentUser
    ? squads.filter((s) => currentUser.squadIds.includes(s.id)).map((s) => s.name)
    : [];

  const accessInfo = currentUser ? accessLevelConfig[currentUser.accessLevel] : null;

  return (
    <aside className="w-64 h-full flex flex-col gradient-sidebar shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoGrupoTG} alt="Grupo TG" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <p className="text-sm font-bold text-sidebar-accent-foreground leading-tight">Grupo TG</p>
            <p className="text-xs text-sidebar-foreground/60 leading-tight">Gestão Operacional</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-3">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 transition-colors shrink-0',
                isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
              )} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        {currentUser?.accessLevel === 3 && (
          <button
            onClick={() => onNavigate('settings')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              currentPage === 'settings'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        )}
        <div className="mt-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
              {currentUser?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{currentUser?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{currentUser ? roleLabels[currentUser.role] || currentUser.role : ''}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          {currentUser && (userSquadNames.length > 0 || accessInfo) && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap px-9">
              {userSquadNames.length > 0 && (
                <span className="text-[10px] text-sidebar-foreground/60 truncate max-w-[120px]" title={userSquadNames.join(', ')}>
                  {userSquadNames.join(', ')}
                </span>
              )}
              {userSquadNames.length > 0 && accessInfo && (
                <span className="text-sidebar-foreground/30 text-[10px]">·</span>
              )}
              {accessInfo && (
                <span className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium', accessInfo.className)}>
                  <Shield className="w-2.5 h-2.5" />
                  {accessInfo.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
