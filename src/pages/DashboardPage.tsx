import { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth, differenceInDays, startOfDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users, AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign, UserMinus, UserPlus,
  CalendarIcon, ArrowUpRight, ArrowDownRight, Shield, Clock, XCircle, Filter, X, ChevronDown, ChevronUp, Star
} from 'lucide-react';
import { useHealthScores } from '@/hooks/useHealthScores';
import { useTasks } from '@/contexts/TasksContext';
import { useClients } from '@/contexts/ClientsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { useSquadsQuery } from '@/hooks/useSquadsQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useClientStatusesQuery } from '@/hooks/useClientStatusesQuery';
import { useTaskTypesQuery } from '@/hooks/useTaskTypesQuery';
import { useNpsResponsesQuery, getNpsCategory } from '@/hooks/useNpsResponsesQuery';
import { PageHeader } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
type PeriodPreset = 'week' | 'month' | 'quarter' | 'custom';

interface DrillDownItem {
  id: string;
  name: string;
  detail: string;
  status?: string;
}

interface Filters {
  period: PeriodPreset;
  dateFrom: Date;
  dateTo: Date;
  squad: string;
  responsible: string;
  platform: string;
  phase: string;
  health: string;
  priority: string;
}

// ── Clickable stat ───────────────────────────────────────────────────────────
function ClickableStat({ label, value, icon, accent, trend, onClick }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
  trend?: { value: number; positive: boolean };
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer hover:border-primary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', trend.positive ? 'text-emerald-600' : 'text-destructive')}>
              {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend.value > 0 ? '+' : ''}{trend.value} vs sem. anterior
            </div>
          )}
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', accent || 'bg-primary/10')}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Drill-down Dialog ────────────────────────────────────────────────────────
function DrillDownDialog({ open, onOpenChange, title, items }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  items: DrillDownItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title} ({items.length})</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>}
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              {item.status && <Badge variant="outline" className="text-xs">{item.status}</Badge>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ children, icon, danger }: { children: React.ReactNode; icon?: React.ReactNode; danger?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 mb-4', danger && 'text-destructive')}>
      {icon}
      <h2 className="text-base font-semibold">{children}</h2>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.accessLevel === 3;

  const { getVisibleClients } = useClients();
  const allClients = getVisibleClients();
  const { tasks: allTasks } = useTasks();
  const { data: allPlatforms = [] } = useClientPlatformsQuery();
  const { data: squads = [] } = useSquadsQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: platformsList = [] } = usePlatformsQuery();
  const { data: clientStatuses = [] } = useClientStatusesQuery('clients');
  const { data: taskTypes = [] } = useTaskTypesQuery();
  const { data: allNpsResponses = [] } = useNpsResponsesQuery();

  const platformLabels = useMemo(() => {
    const m: Record<string, string> = {};
    platformsList.forEach(p => { m[p.slug] = p.name; });
    return m;
  }, [platformsList]);

  // ── Filters State ──────────────────────────────────────────────────────────
  const now = new Date();
  const [filters, setFilters] = useState<Filters>({
    period: 'month',
    dateFrom: startOfMonth(now),
    dateTo: endOfMonth(now),
    squad: '_all',
    responsible: '_all',
    platform: '_all',
    phase: '_all',
    health: '_all',
    priority: '_all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const setPeriod = (p: PeriodPreset) => {
    let from = now, to = now;
    if (p === 'week') { from = startOfWeek(now, { weekStartsOn: 1 }); to = endOfWeek(now, { weekStartsOn: 1 }); }
    else if (p === 'month') { from = startOfMonth(now); to = endOfMonth(now); }
    else if (p === 'quarter') { from = startOfMonth(subMonths(now, 2)); to = endOfMonth(now); }
    setFilters(f => ({ ...f, period: p, dateFrom: from, dateTo: to }));
  };

  const updateFilter = (key: keyof Filters, val: string) => setFilters(f => ({ ...f, [key]: val }));

  // ── Filtered data ──────────────────────────────────────────────────────────
  const clients = useMemo(() => {
    return allClients.filter(c => {
      if (filters.squad !== '_all' && c.squadId !== filters.squad) return false;
      if (filters.responsible !== '_all' && c.responsible !== filters.responsible && c.csResponsavel !== filters.responsible) return false;
      if (filters.health !== '_all' && (c.healthColor ?? 'white') !== filters.health) return false;
      if (filters.priority !== '_all' && c.prioridadeGeral !== filters.priority) return false;
      if (filters.phase !== '_all' && c.faseMacro !== filters.phase) return false;
      return true;
    });
  }, [allClients, filters]);

  const clientIds = useMemo(() => new Set(clients.map(c => c.id)), [clients]);

  const platforms = useMemo(() => {
    return allPlatforms.filter(p => {
      if (!clientIds.has(p.clientId)) return false;
      if (filters.platform !== '_all' && p.platformSlug !== filters.platform) return false;
      if (filters.squad !== '_all' && p.squadId !== filters.squad) return false;
      return true;
    });
  }, [allPlatforms, clientIds, filters]);

  const tasks = useMemo(() => {
    return allTasks.filter(t => {
      if (!clientIds.has(t.clientId)) return false;
      if (filters.responsible !== '_all' && t.responsible !== filters.responsible) return false;
      return true;
    });
  }, [allTasks, clientIds, filters]);

  // ── Drill-down state ──────────────────────────────────────────────────────
  const [drillDown, setDrillDown] = useState<{ title: string; items: DrillDownItem[] } | null>(null);
  const openDrill = (title: string, items: DrillDownItem[]) => setDrillDown({ title, items });

  // ── Churn keys ─────────────────────────────────────────────────────────────
  const churnKeys = useMemo(() => new Set(
    clientStatuses.filter(s => s.label.toLowerCase().includes('churn') || s.label.toLowerCase().includes('cancelad')).map(s => s.key)
  ), [clientStatuses]);

  // ── BLOCO 1: Operação Geral ────────────────────────────────────────────────
  const activeClients = clients.filter(c => !churnKeys.has(c.status));
  const implClients = activeClients.filter(c => c.faseMacro === 'implementacao');
  const perfClients = activeClients.filter(c => c.faseMacro === 'performance');
  const escalaClients = activeClients.filter(c => c.faseMacro === 'escala');
  const churnClients = clients.filter(c => churnKeys.has(c.status));

  // Variation vs last week
  const lastWeekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1);
  const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
  const prevClients = allClients.filter(c => {
    const d = parseISO(c.startDate);
    return d <= lastWeekEnd;
  });
  const prevActive = prevClients.filter(c => !churnKeys.has(c.status)).length;
  const activeVariation = activeClients.length - prevActive;

  // ── BLOCO 2: Plataformas ───────────────────────────────────────────────────
  const activePlatforms = platforms.filter(p => p.phase !== 'churn' && p.phase !== 'cancelado');
  const onboardPlatforms = platforms.filter(p => p.phase === 'onboarding');
  const implPlatforms = platforms.filter(p => p.phase === 'implementacao' || p.phase === 'implementação');
  const today = startOfDay(now);
  const overduePlatforms = platforms.filter(p => p.deadline && new Date(p.deadline) < today && !['performance', 'done', 'escala', 'churn', 'cancelado'].includes(p.phase));
  const readyPlatforms = platforms.filter(p => p.prontaPerformance);

  const platformDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    activePlatforms.forEach(p => { map[p.platformSlug] = (map[p.platformSlug] || 0) + 1; });
    const COLORS = ['hsl(var(--primary))', '#ee4d2d', '#000', '#06b6d4', '#f97316', '#8b5cf6', '#10b981'];
    return Object.entries(map).map(([slug, count], i) => ({
      name: platformLabels[slug] || slug,
      value: count,
      color: COLORS[i % COLORS.length],
    }));
  }, [activePlatforms, platformLabels]);

  // ── BLOCO 3: Atrasos ──────────────────────────────────────────────────────
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < today && t.status !== 'done');
  const stuckClients3 = useMemo(() => {
    return clients.filter(c => {
      const cTasks = tasks.filter(t => t.clientId === c.id && t.status !== 'done' && new Date(t.deadline) < today);
      return cTasks.some(t => differenceInDays(today, new Date(t.deadline)) >= 3);
    });
  }, [clients, tasks, today]);
  const stuckClients7 = useMemo(() => {
    return clients.filter(c => {
      const cTasks = tasks.filter(t => t.clientId === c.id && t.status !== 'done' && new Date(t.deadline) < today);
      return cTasks.some(t => differenceInDays(today, new Date(t.deadline)) >= 7);
    });
  }, [clients, tasks, today]);
  const platformsStuckClient = overduePlatforms.filter(p => p.dependeCliente);
  const platformsStuckOps = overduePlatforms.filter(p => !p.dependeCliente);

  const delayReasonsChart = useMemo(() => {
    const map: Record<string, number> = {};
    [...overdueTasks.map(t => t.motivoAtraso), ...overduePlatforms.map(p => p.motivoAtraso)]
      .filter(r => r && r.trim())
      .forEach(r => { map[r] = (map[r] || 0) + 1; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.length > 25 ? name.slice(0, 25) + '…' : name, value }));
  }, [overdueTasks, overduePlatforms]);

  // ── BLOCO 4: Equipe ───────────────────────────────────────────────────────
  const teamData = useMemo(() => {
    const responsibles = new Set(tasks.map(t => t.responsible).filter(Boolean));
    return Array.from(responsibles).map(name => {
      const myTasks = tasks.filter(t => t.responsible === name);
      const done = myTasks.filter(t => t.status === 'done').length;
      const overdue = myTasks.filter(t => new Date(t.deadline) < today && t.status !== 'done').length;
      const active = myTasks.filter(t => t.status !== 'done').length;
      const onTime = done > 0 ? Math.round((myTasks.filter(t => t.status === 'done' && (!t.deadline || new Date(t.deadline) >= new Date(t.completedAt || t.deadline))).length / done) * 100) : 0;
      return { name, done, overdue, active, onTime };
    }).sort((a, b) => b.active - a.active);
  }, [tasks, today]);

  const overloaded = teamData.filter(t => t.active > 8);

  // ── BLOCO 5: Receita ──────────────────────────────────────────────────────
  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthlyRevenue || 0), 0), [activeClients]);

  const revenueByPlatform = useMemo(() => {
    const map: Record<string, number> = {};
    activeClients.forEach(c => {
      const plats = c.platforms?.length ? c.platforms : ['outro'];
      const rev = (c.monthlyRevenue || 0) / plats.length;
      plats.forEach(p => { map[p] = (map[p] || 0) + rev; });
    });
    return Object.entries(map).map(([slug, value]) => ({
      name: platformLabels[slug] || slug,
      value: Math.round(value),
    })).sort((a, b) => b.value - a.value);
  }, [activeClients, platformLabels]);

  const addedInPeriod = clients.filter(c => {
    const d = parseISO(c.startDate);
    return isWithinInterval(d, { start: filters.dateFrom, end: filters.dateTo });
  }).length;

  const churnInPeriod = churnClients.length;

  const allHealthScores = useHealthScores();
  const healthCounts = useMemo(() => {
    const counts = { green: 0, yellow: 0, red: 0, white: 0 };
    activeClients.forEach(c => {
      const h = allHealthScores[c.id]?.color ?? 'white';
      counts[h as keyof typeof counts] = (counts[h as keyof typeof counts] || 0) + 1;
    });
    return counts;
  }, [activeClients, allHealthScores]);

  const churnRiskClients = activeClients.filter(c => c.riscoChurn && c.riscoChurn !== 'baixo');

  // NPS Consolidated
  const npsStats = useMemo(() => {
    const scored = allNpsResponses.filter(r => r.score != null);
    if (scored.length === 0) return { score: 0, promoters: 0, neutrals: 0, detractors: 0, total: 0 };
    const promoters = scored.filter(r => r.score! >= 9).length;
    const detractors = scored.filter(r => r.score! <= 6).length;
    const neutrals = scored.length - promoters - detractors;
    const npsScore = Math.round(((promoters - detractors) / scored.length) * 100);
    return { score: npsScore, promoters, neutrals, detractors, total: scored.length };
  }, [allNpsResponses]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 animate-fade-in space-y-6">
      <PageHeader title="Dashboard Executivo" subtitle="Visão gerencial da operação em tempo real" />

      {/* ── FILTROS GLOBAIS ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filtros</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Period presets — always visible */}
          <div className="flex items-center gap-2 flex-wrap">
            {([['week', 'Semana'], ['month', 'Mês'], ['quarter', 'Trimestre']] as [PeriodPreset, string][]).map(([key, label]) => (
              <Button key={key} variant={filters.period === key ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(key)} className="text-xs h-7">{label}</Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1"><CalendarIcon className="w-3 h-3" />{format(filters.dateFrom, 'dd/MM')} — {format(filters.dateTo, 'dd/MM')}</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={{ from: filters.dateFrom, to: filters.dateTo }} onSelect={(range) => { if (range?.from && range?.to) setFilters(f => ({ ...f, period: 'custom', dateFrom: range.from!, dateTo: range.to! })); }} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            {/* Quick squad/responsible filters */}
            <Select value={filters.squad} onValueChange={v => updateFilter('squad', v)}>
              <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue placeholder="Squad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos Squads</SelectItem>
                {squads.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.platform} onValueChange={v => updateFilter('platform', v)}>
              <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue placeholder="Plataforma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                {platformsList.map(p => <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {(filters.squad !== '_all' || filters.platform !== '_all' || filters.responsible !== '_all' || filters.phase !== '_all' || filters.health !== '_all' || filters.priority !== '_all') && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => setFilters(f => ({ ...f, squad: '_all', responsible: '_all', platform: '_all', phase: '_all', health: '_all', priority: '_all' }))}>
                <X className="w-3 h-3" /> Limpar
              </Button>
            )}
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Select value={filters.responsible} onValueChange={v => updateFilter('responsible', v)}>
                <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  {appUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.phase} onValueChange={v => updateFilter('phase', v)}>
                <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue placeholder="Fase" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas</SelectItem>
                  <SelectItem value="implementacao">Implementação</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="escala">Escala</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.health} onValueChange={v => updateFilter('health', v)}>
                <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue placeholder="Saúde" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas</SelectItem>
                  <SelectItem value="green">🟢 Saudável</SelectItem>
                  <SelectItem value="yellow">🟡 Atenção</SelectItem>
                  <SelectItem value="red">🔴 Crítico</SelectItem>
                  <SelectItem value="white">⚪ N/A</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={v => updateFilter('priority', v)}>
                <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                  <SelectItem value="P3">P3</SelectItem>
                  <SelectItem value="P4">P4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── BLOCO 1: OPERAÇÃO GERAL ────────────────────────────────────────── */}
      <div>
        <SectionTitle icon={<Users className="w-4 h-4" />}>Operação Geral</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <ClickableStat
            label="Clientes Ativos" value={activeClients.length}
            icon={<Users className="w-4 h-4 text-primary" />} accent="bg-primary/10"
            trend={{ value: activeVariation, positive: activeVariation >= 0 }}
            onClick={() => openDrill('Clientes Ativos', activeClients.map(c => ({ id: c.id, name: c.name, detail: `${c.responsible || 'Sem resp.'} • ${c.faseMacro || 'N/A'}`, status: c.faseMacro })))}
          />
          <ClickableStat
            label="Implementação" value={implClients.length}
            icon={<Activity className="w-4 h-4 text-blue-500" />} accent="bg-blue-500/10"
            onClick={() => openDrill('Clientes em Implementação', implClients.map(c => ({ id: c.id, name: c.name, detail: c.responsible || 'Sem resp.', status: c.subStatus || 'impl.' })))}
          />
          <ClickableStat
            label="Performance" value={perfClients.length}
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} accent="bg-emerald-500/10"
            onClick={() => openDrill('Clientes Performance', perfClients.map(c => ({ id: c.id, name: c.name, detail: c.responsible || '' })))}
          />
          <ClickableStat
            label="Escala" value={escalaClients.length}
            icon={<ArrowUpRight className="w-4 h-4 text-violet-500" />} accent="bg-violet-500/10"
            onClick={() => openDrill('Clientes Escala', escalaClients.map(c => ({ id: c.id, name: c.name, detail: c.responsible || '' })))}
          />
          <ClickableStat
            label="Inativos/Churn" value={churnClients.length}
            icon={<UserMinus className="w-4 h-4 text-muted-foreground" />} accent="bg-muted"
            onClick={() => openDrill('Inativos/Churn', churnClients.map(c => ({ id: c.id, name: c.name, detail: c.status })))}
          />
        </div>
      </div>

      {/* ── BLOCO 2: PLATAFORMAS ───────────────────────────────────────────── */}
      <div>
        <SectionTitle icon={<Shield className="w-4 h-4" />}>Plataformas</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ClickableStat label="Ativas" value={activePlatforms.length} icon={<Activity className="w-4 h-4 text-primary" />} accent="bg-primary/10" />
            <ClickableStat label="Onboard" value={onboardPlatforms.length} icon={<UserPlus className="w-4 h-4 text-blue-500" />} accent="bg-blue-500/10" />
            <ClickableStat label="Implementação" value={implPlatforms.length} icon={<Clock className="w-4 h-4 text-amber-500" />} accent="bg-amber-500/10" />
            <ClickableStat
              label="Atrasadas" value={overduePlatforms.length}
              icon={<AlertTriangle className="w-4 h-4 text-destructive" />} accent="bg-destructive/10"
              onClick={() => openDrill('Plataformas Atrasadas', overduePlatforms.map(p => {
                const cl = clients.find(c => c.id === p.clientId);
                return { id: p.id, name: cl?.name || p.clientId, detail: `${platformLabels[p.platformSlug] || p.platformSlug} • Prazo: ${p.deadline ? format(new Date(p.deadline), 'dd/MM') : 'N/A'}`, status: p.phase };
              }))}
            />
            <ClickableStat label="Prontas Perf." value={readyPlatforms.length} icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} accent="bg-emerald-500/10" />
          </div>

          {/* Pie chart */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {platformDistribution.length > 0 ? (
                <div className="flex items-center gap-4">
                  <PieChart width={110} height={110}>
                    <Pie data={platformDistribution} cx={50} cy={50} innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={2}>
                      {platformDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => v} />
                  </PieChart>
                  <div className="space-y-1.5 flex-1">
                    {platformDistribution.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground">Sem plataformas</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── BLOCO 3: ATRASOS ───────────────────────────────────────────────── */}
      <div>
        <SectionTitle icon={<AlertTriangle className="w-4 h-4" />} danger>Atrasos</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ClickableStat
              label="Demandas Atrasadas" value={overdueTasks.length}
              icon={<XCircle className="w-4 h-4 text-destructive" />} accent="bg-destructive/10"
              onClick={() => openDrill('Demandas Atrasadas', overdueTasks.slice(0, 50).map(t => ({ id: t.id, name: t.title, detail: `${t.clientName} • ${t.responsible || 'N/A'}`, status: t.status })))}
            />
            <ClickableStat
              label="Plataformas Atrasadas" value={overduePlatforms.length}
              icon={<AlertTriangle className="w-4 h-4 text-destructive" />} accent="bg-destructive/10"
            />
            <ClickableStat
              label="Travados +3 dias" value={stuckClients3.length}
              icon={<Clock className="w-4 h-4 text-amber-500" />} accent="bg-amber-500/10"
              onClick={() => openDrill('Clientes Travados +3 dias', stuckClients3.map(c => ({ id: c.id, name: c.name, detail: c.responsible || '' })))}
            />
            <ClickableStat
              label="Travados +7 dias" value={stuckClients7.length}
              icon={<Clock className="w-4 h-4 text-destructive" />} accent="bg-destructive/10"
              onClick={() => openDrill('Clientes Travados +7 dias', stuckClients7.map(c => ({ id: c.id, name: c.name, detail: c.responsible || '' })))}
            />
            <ClickableStat label="Falta de Cliente" value={platformsStuckClient.length} icon={<UserMinus className="w-4 h-4 text-amber-500" />} accent="bg-amber-500/10" />
            <ClickableStat label="Erro Operacional" value={platformsStuckOps.length} icon={<XCircle className="w-4 h-4 text-destructive" />} accent="bg-destructive/10" />
          </div>

          {/* Top 5 delay reasons */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Top 5 Motivos de Atraso</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {delayReasonsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={delayReasonsChart} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">Nenhum motivo registrado</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── BLOCO 4: EQUIPE ────────────────────────────────────────────────── */}
      <div>
        <SectionTitle icon={<Activity className="w-4 h-4" />}>Equipe</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Demandas por Colaborador</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {teamData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={teamData.slice(0, 10)} margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="done" name="Concluídas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overdue" name="Atrasadas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">Sem dados</p>}
            </CardContent>
          </Card>

          {/* Team load + overloaded */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Carga por Colaborador</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {teamData.slice(0, 8).map(member => {
                const color = member.active <= 4 ? 'bg-emerald-500' : member.active <= 8 ? 'bg-amber-400' : 'bg-destructive';
                const emoji = member.active <= 4 ? '🟢' : member.active <= 8 ? '🟡' : '🔴';
                return (
                  <div key={member.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{member.name.split(' ')[0]}</span>
                      <span className="text-xs text-muted-foreground">{emoji} {member.active} ativas</span>
                    </div>
                    <Progress value={Math.min(100, (member.active / 12) * 100)} className="h-1.5" />
                  </div>
                );
              })}
              {overloaded.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-destructive mb-1">⚠ Sobrecarregados ({'>'}8)</p>
                  {overloaded.map(m => (
                    <p key={m.name} className="text-xs text-destructive">{m.name} — {m.active} tarefas</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── BLOCO 5: RECEITA E CARTEIRA (admin only) ──────────────────────── */}
      {isAdmin && (
        <div>
          <SectionTitle icon={<DollarSign className="w-4 h-4" />}>Receita e Carteira</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <ClickableStat label="MRR Total" value={`R$ ${mrr.toLocaleString('pt-BR')}`} icon={<DollarSign className="w-4 h-4 text-emerald-500" />} accent="bg-emerald-500/10" />
            <ClickableStat label="Novos no Período" value={addedInPeriod} icon={<UserPlus className="w-4 h-4 text-blue-500" />} accent="bg-blue-500/10" />
            <ClickableStat label="Churn" value={churnInPeriod} icon={<UserMinus className="w-4 h-4 text-destructive" />} accent="bg-destructive/10" />
            <ClickableStat
              label="Risco de Churn" value={churnRiskClients.length}
              icon={<AlertTriangle className="w-4 h-4 text-amber-500" />} accent="bg-amber-500/10"
              onClick={() => openDrill('Clientes em Risco de Churn', churnRiskClients.map(c => ({ id: c.id, name: c.name, detail: `Risco: ${c.riscoChurn}`, status: c.riscoChurn })))}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue by platform */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Receita por Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {revenueByPlatform.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={revenueByPlatform}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                      <Bar dataKey="value" name="MRR" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground">Sem dados</p>}
              </CardContent>
            </Card>

            {/* Health donut */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Saúde da Carteira</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-4">
                  <PieChart width={110} height={110}>
                    <Pie
                      data={[
                        { name: 'Saudável', value: healthCounts.green, color: '#10b981' },
                        { name: 'Atenção', value: healthCounts.yellow, color: '#f59e0b' },
                        { name: 'Crítico', value: healthCounts.red, color: '#ef4444' },
                        { name: 'N/A', value: healthCounts.white, color: '#94a3b8' },
                      ].filter(d => d.value > 0)}
                      cx={50} cy={50} innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={2}
                    >
                      {[
                        { color: '#10b981' }, { color: '#f59e0b' }, { color: '#ef4444' }, { color: '#94a3b8' },
                      ].map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                  <div className="space-y-2">
                    {[
                      { label: 'Saudável', count: healthCounts.green, color: '#10b981' },
                      { label: 'Atenção', count: healthCounts.yellow, color: '#f59e0b' },
                      { label: 'Crítico', count: healthCounts.red, color: '#ef4444' },
                      { label: 'N/A', count: healthCounts.white, color: '#94a3b8' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── BLOCO 6: NPS CONSOLIDADO ──────────────────────────────────────── */}
      {isAdmin && npsStats.total > 0 && (
        <div>
          <SectionTitle icon={<Star className="w-4 h-4" />}>NPS Consolidado</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">NPS Score</p>
                <div className="relative w-24 h-24 mb-2">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" className="stroke-border" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      className={npsStats.score >= 50 ? 'stroke-success' : npsStats.score >= 0 ? 'stroke-warning' : 'stroke-destructive'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.max(0, ((npsStats.score + 100) / 200) * 251.3)} 251.3`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn('text-2xl font-bold', npsStats.score >= 50 ? 'text-success' : npsStats.score >= 0 ? 'text-warning' : 'text-destructive')}>
                      {npsStats.score}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{npsStats.total} respostas</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Distribuição NPS</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-success">🟢 Promotores (9-10)</span>
                      <span className="text-xs font-bold">{npsStats.promoters} ({npsStats.total > 0 ? Math.round((npsStats.promoters / npsStats.total) * 100) : 0}%)</span>
                    </div>
                    <Progress value={npsStats.total > 0 ? (npsStats.promoters / npsStats.total) * 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-warning">🟡 Neutros (7-8)</span>
                      <span className="text-xs font-bold">{npsStats.neutrals} ({npsStats.total > 0 ? Math.round((npsStats.neutrals / npsStats.total) * 100) : 0}%)</span>
                    </div>
                    <Progress value={npsStats.total > 0 ? (npsStats.neutrals / npsStats.total) * 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-destructive">🔴 Detratores (0-6)</span>
                      <span className="text-xs font-bold">{npsStats.detractors} ({npsStats.total > 0 ? Math.round((npsStats.detractors / npsStats.total) * 100) : 0}%)</span>
                    </div>
                    <Progress value={npsStats.total > 0 ? (npsStats.detractors / npsStats.total) * 100 : 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Drill-down Dialog ──────────────────────────────────────────────── */}
      <DrillDownDialog
        open={!!drillDown}
        onOpenChange={(o) => !o && setDrillDown(null)}
        title={drillDown?.title || ''}
        items={drillDown?.items || []}
      />
    </div>
  );
}
