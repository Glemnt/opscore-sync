import { useMemo, useState } from 'react';
import { useClientsQuery } from '@/hooks/useClientsQuery';
import { useOnboardingChecklistQuery, useUpsertChecklistItem } from '@/hooks/useOnboardingChecklistQuery';
import { useAuth } from '@/contexts/AuthContext';
import {
  ONBOARDING_TASKS,
  ONBOARDING_TASK_GROUPS,
  addBusinessDays,
  computeSemaforo,
  computeOverallSemaforo,
  type SemaforoStatus,
} from '@/lib/onboardingTasks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle, Minus, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const SEMAFORO_COLORS: Record<SemaforoStatus, string> = {
  verde: 'text-emerald-400',
  amarelo: 'text-yellow-400',
  vermelho: 'text-red-400',
  azul: 'text-blue-400',
  preto: 'text-muted-foreground/40',
};

const SEMAFORO_BG: Record<SemaforoStatus, string> = {
  verde: 'bg-emerald-500/20',
  amarelo: 'bg-yellow-500/20',
  vermelho: 'bg-red-500/20',
  azul: 'bg-blue-500/20',
  preto: 'bg-muted/30',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  feito: <Check className="w-3.5 h-3.5" />,
  pendente: <Circle className="w-3.5 h-3.5" />,
  atrasado: <AlertTriangle className="w-3.5 h-3.5" />,
  nao_aplica: <Minus className="w-3.5 h-3.5" />,
};

function StatusCell({
  status,
  semaforo,
  onClick,
  title,
}: {
  status: string;
  semaforo: SemaforoStatus;
  onClick: () => void;
  title: string;
}) {
  const displayStatus = status === 'pendente' && semaforo === 'vermelho' ? 'atrasado' : status;
  const color = displayStatus === 'feito'
    ? 'text-blue-400'
    : displayStatus === 'nao_aplica'
    ? 'text-muted-foreground/40'
    : SEMAFORO_COLORS[semaforo];

  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-full h-full flex items-center justify-center p-1 transition-colors hover:bg-accent/40 rounded',
        color
      )}
    >
      {STATUS_ICON[displayStatus] || STATUS_ICON.pendente}
    </button>
  );
}

function SemaforoBadge({ status }: { status: SemaforoStatus }) {
  const labels: Record<SemaforoStatus, string> = {
    verde: '🟢 No Prazo',
    amarelo: '🟡 Atenção',
    vermelho: '🔴 Atrasado',
    azul: '🔵 Entregue',
    preto: '⚫ N/A',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium', SEMAFORO_BG[status], SEMAFORO_COLORS[status])}>
      {labels[status]}
    </span>
  );
}

export function OnboardingChecklistPage() {
  const { data: clients = [] } = useClientsQuery();
  const { data: checklistItems = [], isLoading } = useOnboardingChecklistQuery();
  const upsertMutation = useUpsertChecklistItem();
  const { currentUser } = useAuth();

  const [filterCS, setFilterCS] = useState('all');
  const [filterSemaforo, setFilterSemaforo] = useState('all');
  const [filterPerfil, setFilterPerfil] = useState('all');
  const [searchName, setSearchName] = useState('');

  // Build items map: clientId -> { taskKey -> status }
  const itemsMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const item of checklistItems) {
      if (!map[item.clientId]) map[item.clientId] = {};
      map[item.clientId][item.taskKey] = item.status;
    }
    return map;
  }, [checklistItems]);

  // Filter clients in onboarding/implementação
  const onboardingClients = useMemo(() => {
    return clients.filter((c) => {
      const fase = c.faseMacro || c.phase || '';
      return ['implementacao', 'onboarding'].includes(fase) || c.status === 'onboarding' || c.subStatus === 'onboard';
    });
  }, [clients]);

  // Get unique CS names
  const csNames = useMemo(() => {
    const names = new Set(onboardingClients.map((c) => c.csResponsavel || c.responsible).filter(Boolean));
    return Array.from(names).sort();
  }, [onboardingClients]);

  // Apply filters
  const filteredClients = useMemo(() => {
    return onboardingClients.filter((c) => {
      const cs = c.csResponsavel || c.responsible || '';
      if (filterCS !== 'all' && cs !== filterCS) return false;

      if (filterPerfil !== 'all' && c.perfilCliente !== filterPerfil) return false;

      if (searchName && !c.name.toLowerCase().includes(searchName.toLowerCase())) return false;

      if (filterSemaforo !== 'all') {
        const overall = computeOverallSemaforo(ONBOARDING_TASKS, itemsMap[c.id] || {}, c.startDate);
        if (overall !== filterSemaforo) return false;
      }

      return true;
    });
  }, [onboardingClients, filterCS, filterSemaforo, filterPerfil, searchName, itemsMap]);

  // Counters
  const counters = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let emOnboarding = 0;
    let carteiraBase = 0;

    for (const c of onboardingClients) {
      const start = new Date(c.startDate);
      const d20 = addBusinessDays(start, 20);
      if (today <= d20) emOnboarding++;
      else carteiraBase++;
    }

    return {
      total: onboardingClients.length,
      emOnboarding,
      carteiraBase,
    };
  }, [onboardingClients]);

  const handleCellClick = (clientId: string, taskKey: string) => {
    const currentStatus = itemsMap[clientId]?.[taskKey] || 'pendente';
    upsertMutation.mutate({
      clientId,
      taskKey,
      currentStatus,
      userName: currentUser?.name || '',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando checklist...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Checklist Onboarding</h1>
        <p className="text-sm text-muted-foreground">Esteira D1-D15 de onboarding técnico</p>
      </div>

      {/* Counters */}
      <div className="flex flex-wrap gap-3">
        <CounterCard label="Total" value={counters.total} className="bg-card" />
        <CounterCard label="Em Onboarding (≤20d)" value={counters.emOnboarding} className="bg-emerald-500/10 text-emerald-400" />
        <CounterCard label="Carteira Base (>20d)" value={counters.carteiraBase} className="bg-amber-500/10 text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <label className="text-xs text-muted-foreground mb-1 block">Buscar cliente</label>
          <Input
            placeholder="Nome..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="w-40">
          <label className="text-xs text-muted-foreground mb-1 block">CS Responsável</label>
          <Select value={filterCS} onValueChange={setFilterCS}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {csNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <label className="text-xs text-muted-foreground mb-1 block">Semáforo</label>
          <Select value={filterSemaforo} onValueChange={setFilterSemaforo}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="verde">🟢 No Prazo</SelectItem>
              <SelectItem value="amarelo">🟡 Atenção</SelectItem>
              <SelectItem value="vermelho">🔴 Atrasado</SelectItem>
              <SelectItem value="azul">🔵 Entregue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <label className="text-xs text-muted-foreground mb-1 block">Perfil</label>
          <Select value={filterPerfil} onValueChange={setFilterPerfil}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="brasileiro">Brasileiro</SelectItem>
              <SelectItem value="boliviano">Boliviano</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full text-xs">
            <thead>
              {/* Group header row */}
              <tr className="border-b border-border bg-muted/30">
                <th colSpan={6} className="sticky left-0 z-20 bg-muted/30 px-2 py-1.5 text-left text-muted-foreground font-medium">
                  Identificação
                </th>
                {ONBOARDING_TASK_GROUPS.map((g) => {
                  const count = ONBOARDING_TASKS.filter((t) => t.group === g.id).length;
                  return (
                    <th key={g.id} colSpan={count} className="px-1 py-1.5 text-center">
                      <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-medium', g.color)}>
                        {g.label}
                      </span>
                    </th>
                  );
                })}
              </tr>
              {/* Task header row */}
              <tr className="border-b border-border bg-muted/20">
                <th className="sticky left-0 z-20 bg-muted/20 px-2 py-1.5 text-left min-w-[140px]">Cliente</th>
                <th className="sticky left-[140px] z-20 bg-muted/20 px-2 py-1.5 text-left min-w-[90px]">CS</th>
                <th className="px-2 py-1.5 text-left min-w-[70px]">Perfil</th>
                <th className="px-2 py-1.5 text-left min-w-[80px]">Entrada</th>
                <th className="px-2 py-1.5 text-left min-w-[80px]">D15 Int.</th>
                <th className="px-2 py-1.5 text-center min-w-[80px]">Semáforo</th>
                {ONBOARDING_TASKS.map((t) => (
                  <th key={t.key} className="px-1 py-1.5 text-center min-w-[70px] max-w-[90px]" title={t.label}>
                    <span className="block text-[10px] leading-tight break-words text-muted-foreground">{t.shortLabel}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6 + ONBOARDING_TASKS.length} className="py-8 text-center text-muted-foreground">
                    Nenhum cliente em onboarding encontrado.
                  </td>
                </tr>
              )}
              {filteredClients.map((client) => {
                const clientItems = itemsMap[client.id] || {};
                const startDate = client.startDate;
                const d15 = addBusinessDays(new Date(startDate), 15);
                const overall = computeOverallSemaforo(ONBOARDING_TASKS, clientItems, startDate);
                const cs = client.csResponsavel || client.responsible || '';
                const perfil = client.perfilCliente || '';

                return (
                  <tr key={client.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="sticky left-0 z-10 bg-background px-2 py-1.5 font-medium text-foreground truncate max-w-[140px]" title={client.name}>
                      {client.name}
                    </td>
                    <td className="sticky left-[140px] z-10 bg-background px-2 py-1.5 text-muted-foreground truncate max-w-[90px]" title={cs}>
                      {cs}
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground capitalize">{perfil}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{format(new Date(startDate), 'dd/MM/yy')}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{format(d15, 'dd/MM/yy')}</td>
                    <td className="px-2 py-1.5 text-center"><SemaforoBadge status={overall} /></td>
                    {ONBOARDING_TASKS.map((task) => {
                      const status = clientItems[task.key] || 'pendente';
                      const semaforo = computeSemaforo(status, task.expectedDay, startDate);
                      return (
                        <td key={task.key} className="px-0.5 py-0.5">
                          <StatusCell
                            status={status}
                            semaforo={semaforo}
                            onClick={() => handleCellClick(client.id, task.key)}
                            title={`${task.label}\nStatus: ${status}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-blue-400" /> Feito</span>
        <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-emerald-400" /> No Prazo</span>
        <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-yellow-400" /> Atenção (≤2d)</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" /> Atrasado</span>
        <span className="flex items-center gap-1"><Minus className="w-3 h-3 text-muted-foreground/40" /> N/A</span>
        <span className="text-muted-foreground/50">Clique na célula para alternar status</span>
      </div>
    </div>
  );
}

function CounterCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border px-4 py-2.5', className)}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
