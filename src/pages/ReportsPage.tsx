import { useState, useMemo } from 'react';
import {
  FileText, Download, Users, Building2, BarChart3, TrendingUp,
  Loader2, Calendar, Filter, AlertTriangle, Clock, RefreshCw,
  Star, ShieldAlert, PieChart as PieChartIcon
} from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';
import { useClients } from '@/contexts/ClientsContext';
import { useTasks } from '@/contexts/TasksContext';
import { useSquads } from '@/contexts/SquadsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useClientPlatformsQuery, type ClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useHealthScores } from '@/hooks/useHealthScores';
import { useClientStatusesQuery } from '@/hooks/useClientStatusesQuery';
import { useTaskTypesQuery } from '@/hooks/useTaskTypesQuery';
import { useTeamMembersQuery } from '@/hooks/useTeamMembersQuery';
import { useProjectsQuery } from '@/hooks/useProjectsQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { canViewHealth } from '@/lib/healthScore';
import { taskStatusConfig, priorityConfig, teamRoleConfig } from '@/lib/config';
import {
  generateOperationReport,
  generateTeamPerformanceReport,
  generateClientDetailedReport,
  generateExecutiveReport,
  downloadCsv,
} from '@/lib/reportGenerators';
import type { Client, Task } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, subWeeks, subMonths,
  isWithinInterval, differenceInDays, differenceInCalendarWeeks,
  format, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--destructive))',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

type PeriodPreset = 'week' | 'month' | 'quarter' | 'year';

function getPeriodRange(preset: PeriodPreset): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case 'week': return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
    case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'quarter': return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'year': return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
  }
}

// ─── Filter bar component ───
function FilterBar({
  period, setPeriod,
  squadId, setSquadId,
  responsible, setResponsible,
  platformSlug, setPlatformSlug,
  squads, appUsers, platforms,
  showClientFilter = false,
  clientId, setClientId,
  clients,
}: {
  period: PeriodPreset; setPeriod: (v: PeriodPreset) => void;
  squadId: string; setSquadId: (v: string) => void;
  responsible: string; setResponsible: (v: string) => void;
  platformSlug: string; setPlatformSlug: (v: string) => void;
  squads: any[]; appUsers: any[]; platforms: any[];
  showClientFilter?: boolean;
  clientId?: string; setClientId?: (v: string) => void;
  clients?: Client[];
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Select value={period} onValueChange={v => setPeriod(v as PeriodPreset)}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="week">Semana</SelectItem>
          <SelectItem value="month">Mês</SelectItem>
          <SelectItem value="quarter">Trimestre</SelectItem>
          <SelectItem value="year">Ano</SelectItem>
        </SelectContent>
      </Select>
      <Select value={squadId} onValueChange={setSquadId}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Squad" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Squads</SelectItem>
          {squads.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={responsible} onValueChange={setResponsible}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {appUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={platformSlug} onValueChange={setPlatformSlug}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Plataforma" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {platforms.map(p => <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {showClientFilter && clients && setClientId && (
        <Select value={clientId || ''} onValueChange={setClientId}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ─── KPI Card ───
function KpiCard({ label, value, icon: Icon, variant }: { label: string; value: string | number; icon?: any; variant?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ═════════════════════ MAIN PAGE ═════════════════════
export function ReportsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { clients: allClients, getVisibleClients } = useClients();
  const visibleClients = getVisibleClients();
  const { tasks: allTasks } = useTasks();
  const { squads } = useSquads();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: clientPlatforms = [] } = useClientPlatformsQuery();
  const { data: platforms = [] } = usePlatformsQuery();
  const { data: clientStatuses = [] } = useClientStatusesQuery('clients');
  const { data: taskTypes = [] } = useTaskTypesQuery();
  const { data: teamMembers = [] } = useTeamMembersQuery();
  const { data: projects = [] } = useProjectsQuery();
  const healthScores = useHealthScores();
  const [loading, setLoading] = useState(false);

  const churnKeys = useMemo(() => new Set(
    clientStatuses.filter(s => s.label.toLowerCase().includes('churn')).map(s => s.key)
  ), [clientStatuses]);

  const visibleClientIds = useMemo(() => new Set(visibleClients.map(c => c.id)), [visibleClients]);
  const tasks = useMemo(() => allTasks.filter(t => visibleClientIds.has(t.clientId)), [allTasks, visibleClientIds]);
  const activeClients = useMemo(() => visibleClients.filter(c => !churnKeys.has(c.status)), [visibleClients, churnKeys]);

  // Shared filter state per tab
  const [opPeriod, setOpPeriod] = useState<PeriodPreset>('month');
  const [opSquad, setOpSquad] = useState('all');
  const [opResponsible, setOpResponsible] = useState('all');
  const [opPlatform, setOpPlatform] = useState('all');

  const [eqPeriod, setEqPeriod] = useState<PeriodPreset>('month');
  const [eqSquad, setEqSquad] = useState('all');
  const [eqResponsible, setEqResponsible] = useState('all');
  const [eqPlatform, setEqPlatform] = useState('all');

  const [clPeriod, setClPeriod] = useState<PeriodPreset>('year');
  const [clSquad, setClSquad] = useState('all');
  const [clResponsible, setClResponsible] = useState('all');
  const [clPlatform, setClPlatform] = useState('all');
  const [clClientId, setClClientId] = useState('all');

  const [exPeriod, setExPeriod] = useState<PeriodPreset>('month');
  const [exSquad, setExSquad] = useState('all');
  const [exResponsible, setExResponsible] = useState('all');
  const [exPlatform, setExPlatform] = useState('all');

  // ─── Filter helpers ───
  function filterPlatforms(pList: ClientPlatform[], squad: string, resp: string, platSlug: string) {
    let result = pList.filter(p => visibleClientIds.has(p.clientId));
    if (squad !== 'all') result = result.filter(p => p.squadId === squad);
    if (resp !== 'all') result = result.filter(p => p.responsible === resp);
    if (platSlug !== 'all') result = result.filter(p => p.platformSlug === platSlug);
    return result;
  }

  function filterTasks(tList: Task[], period: PeriodPreset, squad: string, resp: string, platSlug: string) {
    const range = getPeriodRange(period);
    let result = tList;
    if (resp !== 'all') result = result.filter(t => t.responsible === resp);
    if (platSlug !== 'all') result = result.filter(t => t.platforms?.includes(platSlug));
    if (squad !== 'all') {
      const squadObj = squads.find(s => s.id === squad);
      if (squadObj) {
        const memberNames = new Set(squadObj.members);
        result = result.filter(t => memberNames.has(t.responsible));
      }
    }
    return result;
  }

  function filterTasksByPeriodDone(tList: Task[], period: PeriodPreset) {
    const range = getPeriodRange(period);
    return tList.filter(t => {
      if (t.status !== 'done' || !t.completedAt) return false;
      const d = parseISO(t.completedAt);
      return isWithinInterval(d, range);
    });
  }

  // ═══════════ Tab: Operação ═══════════
  const opFilteredPlatforms = useMemo(() => filterPlatforms(clientPlatforms, opSquad, opResponsible, opPlatform), [clientPlatforms, opSquad, opResponsible, opPlatform, visibleClientIds]);
  const opFilteredTasks = useMemo(() => filterTasks(tasks, opPeriod, opSquad, opResponsible, opPlatform), [tasks, opPeriod, opSquad, opResponsible, opPlatform, squads]);

  const phaseLabels: Record<string, string> = {
    onboarding: 'Onboarding',
    onboard: 'Onboard',
    implementacao: 'Implementação',
    implementacao_ativa: 'Implementação Ativa',
    validacao_final: 'Validação Final',
    performance: 'Performance',
    escala: 'Escala',
    active: 'Ativo',
    paused: 'Pausado',
    pausado: 'Pausado',
    churned: 'Churn',
    cancelado: 'Cancelado',
    inativo: 'Inativo',
    nao_iniciada: 'Não Iniciada',
    aguardando_cliente: 'Aguardando Cliente',
    bloqueada: 'Bloqueada',
    pronta_performance: 'Pronta p/ Performance',
    em_performance: 'Em Performance',
    escalada: 'Escalada',
  };

  const clientsByPhase = useMemo(() => {
    const map: Record<string, number> = {};
    let filtered = activeClients;
    if (opSquad !== 'all') filtered = filtered.filter(c => c.squadId === opSquad);
    filtered.forEach(c => { map[c.faseMacro || 'implementacao'] = (map[c.faseMacro || 'implementacao'] || 0) + 1; });
    return Object.entries(map).map(([key, count]) => ({ name: phaseLabels[key] || key, count })).sort((a, b) => b.count - a.count);
  }, [activeClients, opSquad]);

  const platformsByPhase = useMemo(() => {
    const map: Record<string, number> = {};
    opFilteredPlatforms.forEach(p => { map[p.phase] = (map[p.phase] || 0) + 1; });
    return Object.entries(map).map(([key, count]) => ({ name: phaseLabels[key] || key, count })).sort((a, b) => b.count - a.count);
  }, [opFilteredPlatforms]);

  const platformsByConsultor = useMemo(() => {
    const map: Record<string, number> = {};
    opFilteredPlatforms.forEach(p => { if (p.responsible) map[p.responsible] = (map[p.responsible] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [opFilteredPlatforms]);

  const now = new Date();
  const platformsDelayedByConsultor = useMemo(() => {
    const delayed = opFilteredPlatforms.filter(p => p.deadline && new Date(p.deadline) < now && p.phase !== 'performance');
    const map: Record<string, number> = {};
    delayed.forEach(p => { if (p.responsible) map[p.responsible] = (map[p.responsible] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [opFilteredPlatforms]);

  const top10DelayReasons = useMemo(() => {
    const map: Record<string, number> = {};
    opFilteredTasks.filter(t => t.motivoAtraso).forEach(t => { map[t.motivoAtraso!] = (map[t.motivoAtraso!] || 0) + 1; });
    opFilteredPlatforms.filter(p => p.motivoAtraso).forEach(p => { map[p.motivoAtraso] = (map[p.motivoAtraso] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [opFilteredTasks, opFilteredPlatforms]);

  const avgTimes = useMemo(() => {
    const calcAvg = (list: ClientPlatform[], fromPhase: string) => {
      const relevant = list.filter(p => p.startDate && p.dataRealPassagem);
      if (!relevant.length) return 0;
      const sum = relevant.reduce((acc, p) => acc + differenceInDays(parseISO(p.dataRealPassagem!), parseISO(p.startDate!)), 0);
      return Math.round(sum / relevant.length);
    };
    const onboarding = opFilteredPlatforms.filter(p => p.phase === 'onboarding' || p.dataRealPassagem);
    const impl = opFilteredPlatforms.filter(p => ['implementacao', 'performance'].includes(p.phase));
    return {
      onboarding: calcAvg(onboarding, 'onboarding'),
      implementacao: calcAvg(impl, 'implementacao'),
    };
  }, [opFilteredPlatforms]);

  // ═══════════ Tab: Equipe ═══════════
  const eqFilteredTasks = useMemo(() => filterTasks(tasks, eqPeriod, eqSquad, eqResponsible, eqPlatform), [tasks, eqPeriod, eqSquad, eqResponsible, eqPlatform, squads]);
  const eqDoneTasks = useMemo(() => filterTasksByPeriodDone(eqFilteredTasks, eqPeriod), [eqFilteredTasks, eqPeriod]);

  const tasksByCollaborator = useMemo(() => {
    const map: Record<string, number> = {};
    eqDoneTasks.forEach(t => { map[t.responsible] = (map[t.responsible] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [eqDoneTasks]);

  const overdueByCollaborator = useMemo(() => {
    const overdue = eqFilteredTasks.filter(t => t.status !== 'done' && new Date(t.deadline) < now);
    const map: Record<string, number> = {};
    overdue.forEach(t => { map[t.responsible] = (map[t.responsible] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [eqFilteredTasks]);

  const reworkByCollaborator = useMemo(() => {
    const map: Record<string, number> = {};
    eqFilteredTasks.forEach(t => {
      if ((t.rejectionCount || 0) > 0) {
        map[t.responsible] = (map[t.responsible] || 0) + (t.rejectionCount || 0);
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [eqFilteredTasks]);

  const avgRatingByCollaborator = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    eqFilteredTasks.forEach(t => {
      if (t.notaEntrega != null) {
        if (!map[t.responsible]) map[t.responsible] = { sum: 0, count: 0 };
        map[t.responsible].sum += t.notaEntrega;
        map[t.responsible].count += 1;
      }
    });
    return Object.entries(map).map(([name, { sum, count }]) => ({ name, avg: (sum / count).toFixed(1) })).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));
  }, [eqFilteredTasks]);

  const bottlenecksByCollaborator = useMemo(() => {
    const map: Record<string, number> = {};
    eqFilteredTasks.filter(t => t.dependeCliente || t.aguardandoCliente).forEach(t => {
      map[t.responsible] = (map[t.responsible] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [eqFilteredTasks]);

  const weeklyProductivity = useMemo(() => {
    const weeks: { week: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { locale: ptBR });
      const weekEnd = endOfWeek(subWeeks(now, i), { locale: ptBR });
      const count = tasks.filter(t => {
        if (t.status !== 'done' || !t.completedAt) return false;
        const d = parseISO(t.completedAt);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }).length;
      weeks.push({ week: format(weekStart, 'dd/MM', { locale: ptBR }), count });
    }
    return weeks;
  }, [tasks]);

  // ═══════════ Tab: Cliente ═══════════
  const selectedClient = useMemo(() => activeClients.find(c => c.id === clClientId), [activeClients, clClientId]);

  const clientTasksSummary = useMemo(() => {
    if (!selectedClient) return { open: 0, done: 0, total: 0 };
    const ct = tasks.filter(t => t.clientId === selectedClient.id);
    const done = ct.filter(t => t.status === 'done').length;
    return { open: ct.length - done, done, total: ct.length };
  }, [selectedClient, tasks]);

  const clientDelayReasons = useMemo(() => {
    if (!selectedClient) return [];
    const ct = tasks.filter(t => t.clientId === selectedClient.id && t.motivoAtraso);
    const map: Record<string, number> = {};
    ct.forEach(t => { map[t.motivoAtraso!] = (map[t.motivoAtraso!] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [selectedClient, tasks]);

  const clientPlatformsList = useMemo(() => {
    if (!selectedClient) return [];
    return clientPlatforms.filter(p => p.clientId === selectedClient.id);
  }, [selectedClient, clientPlatforms]);

  // ═══════════ Tab: Executivo ═══════════
  const canSeeExecutive = currentUser && currentUser.accessLevel >= 2;
  const canSeeFinancial = currentUser && currentUser.accessLevel >= 3;

  const exFilteredClients = useMemo(() => {
    let list = activeClients;
    if (exSquad !== 'all') list = list.filter(c => c.squadId === exSquad);
    return list;
  }, [activeClients, exSquad]);

  const backlogBySquad = useMemo(() => {
    const map: Record<string, number> = {};
    const backlogTasks = tasks.filter(t => t.status === 'backlog');
    backlogTasks.forEach(t => {
      const client = activeClients.find(c => c.id === t.clientId);
      const squad = squads.find(s => s.id === client?.squadId);
      const key = squad?.name || 'Sem squad';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [tasks, activeClients, squads]);

  const mrrByPlatform = useMemo(() => {
    if (!canSeeFinancial) return [];
    const map: Record<string, number> = {};
    clientPlatforms.forEach(p => {
      const client = activeClients.find(c => c.id === p.clientId);
      if (!client?.monthlyRevenue) return;
      const platCount = clientPlatforms.filter(cp => cp.clientId === client.id).length;
      if (platCount === 0) return;
      const share = client.monthlyRevenue / platCount;
      const platName = platforms.find(pl => pl.slug === p.platformSlug)?.name || p.platformSlug;
      map[platName] = (map[platName] || 0) + share;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [clientPlatforms, activeClients, platforms, canSeeFinancial]);

  const npsData = useMemo(() => {
    const withNps = exFilteredClients.filter(c => c.npsUltimo != null);
    if (!withNps.length) return { score: null, promoters: 0, detractors: 0, passives: 0, total: 0 };
    const promoters = withNps.filter(c => c.npsUltimo! >= 9).length;
    const detractors = withNps.filter(c => c.npsUltimo! <= 6).length;
    const passives = withNps.length - promoters - detractors;
    const score = Math.round(((promoters - detractors) / withNps.length) * 100);
    return { score, promoters, detractors, passives, total: withNps.length };
  }, [exFilteredClients]);

  const healthDistribution = useMemo(() => {
    const dist = { green: 0, yellow: 0, red: 0, white: 0 };
    exFilteredClients.forEach(c => {
      const hs = healthScores[c.id];
      if (hs) dist[hs.color] = (dist[hs.color] || 0) + 1;
      else dist.white += 1;
    });
    return [
      { name: 'Saudável', value: dist.green, color: '#22c55e' },
      { name: 'Atenção', value: dist.yellow, color: '#eab308' },
      { name: 'Crítico', value: dist.red, color: '#ef4444' },
      { name: 'Sem dados', value: dist.white, color: '#9ca3af' },
    ].filter(d => d.value > 0);
  }, [exFilteredClients, healthScores]);

  const churnRiskClients = useMemo(() => {
    return exFilteredClients.filter(c => c.riscoChurn === 'alto' || c.riscoChurn === 'critico');
  }, [exFilteredClients]);

  // ─── Export handlers ───
  const handleExportOperationPdf = async () => {
    setLoading(true);
    try {
      await generateOperationReport(activeClients, opFilteredPlatforms, opFilteredTasks, platforms);
      toast({ title: 'PDF gerado!', description: 'Relatório de operação baixado.' });
    } finally { setLoading(false); }
  };

  const handleExportTeamPdf = async () => {
    setLoading(true);
    try {
      await generateTeamPerformanceReport(eqFilteredTasks, appUsers, eqDoneTasks);
      toast({ title: 'PDF gerado!', description: 'Relatório de equipe baixado.' });
    } finally { setLoading(false); }
  };

  const handleExportClientPdf = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      const ct = tasks.filter(t => t.clientId === selectedClient.id);
      await generateClientDetailedReport(selectedClient, ct, clientPlatformsList);
      toast({ title: 'PDF gerado!', description: `Relatório do cliente ${selectedClient.name} baixado.` });
    } finally { setLoading(false); }
  };

  const handleExportExecutivePdf = async () => {
    setLoading(true);
    try {
      await generateExecutiveReport(exFilteredClients, clientPlatforms, tasks, healthScores, platforms, npsData);
      toast({ title: 'PDF gerado!', description: 'Relatório executivo baixado.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Relatórios" subtitle="Relatórios gerenciais com dados em tempo real" />

      <Tabs defaultValue="operacao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operacao" className="gap-1"><BarChart3 className="w-4 h-4" />Operação</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1"><Users className="w-4 h-4" />Equipe</TabsTrigger>
          <TabsTrigger value="cliente" className="gap-1"><Building2 className="w-4 h-4" />Cliente</TabsTrigger>
          <TabsTrigger value="executivo" className="gap-1"><TrendingUp className="w-4 h-4" />Executivo</TabsTrigger>
        </TabsList>

        {/* ═══════════ ABA OPERAÇÃO ═══════════ */}
        <TabsContent value="operacao" className="space-y-4">
          <div className="flex items-center justify-between">
            <FilterBar period={opPeriod} setPeriod={setOpPeriod} squadId={opSquad} setSquadId={setOpSquad} responsible={opResponsible} setResponsible={setOpResponsible} platformSlug={opPlatform} setPlatformSlug={setOpPlatform} squads={squads} appUsers={appUsers} platforms={platforms} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExportOperationPdf} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadCsv(['Fase', 'Qtd'], clientsByPhase.map(r => [r.name, String(r.count)]), 'clientes-por-fase')}>
                <FileText className="w-4 h-4" /> CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="Clientes Ativos" value={activeClients.length} icon={Building2} />
            <KpiCard label="Plataformas" value={opFilteredPlatforms.length} icon={BarChart3} />
            <KpiCard label="Tempo Médio Onboarding" value={`${avgTimes.onboarding}d`} icon={Clock} />
            <KpiCard label="Tempo Médio Implementação" value={`${avgTimes.implementacao}d`} icon={Clock} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Clientes por Fase */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Clientes por Fase</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientsByPhase}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Plataformas por Fase */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Plataformas por Fase</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformsByPhase}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Plataformas por Consultor */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Plataformas por Consultor</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Consultor</TableHead><TableHead className="text-right">Qtd</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {platformsByConsultor.map(r => (
                      <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right font-medium">{r.count}</TableCell></TableRow>
                    ))}
                    {!platformsByConsultor.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Plataformas Atrasadas por Consultor */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-destructive" />Plataformas Atrasadas por Consultor</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Consultor</TableHead><TableHead className="text-right">Atrasadas</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {platformsDelayedByConsultor.map(r => (
                      <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right"><Badge variant="destructive">{r.count}</Badge></TableCell></TableRow>
                    ))}
                    {!platformsDelayedByConsultor.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhuma atrasada</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Top 10 Motivos de Atraso */}
          {top10DelayReasons.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Top 10 Motivos de Atraso</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10DelayReasons} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════ ABA EQUIPE ═══════════ */}
        <TabsContent value="equipe" className="space-y-4">
          <div className="flex items-center justify-between">
            <FilterBar period={eqPeriod} setPeriod={setEqPeriod} squadId={eqSquad} setSquadId={setEqSquad} responsible={eqResponsible} setResponsible={setEqResponsible} platformSlug={eqPlatform} setPlatformSlug={setEqPlatform} squads={squads} appUsers={appUsers} platforms={platforms} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExportTeamPdf} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadCsv(['Colaborador', 'Concluídas'], tasksByCollaborator.map(r => [r.name, String(r.count)]), 'tarefas-por-colaborador')}>
                <FileText className="w-4 h-4" /> CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="Tarefas Concluídas" value={eqDoneTasks.length} icon={BarChart3} />
            <KpiCard label="Total no Período" value={eqFilteredTasks.length} icon={FileText} />
            <KpiCard label="Colaboradores" value={appUsers.length} icon={Users} />
            <KpiCard label="Atrasadas" value={eqFilteredTasks.filter(t => t.status !== 'done' && new Date(t.deadline) < now).length} icon={AlertTriangle} />
          </div>

          {/* Produtividade Semanal */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Produtividade Semanal (últimas 12 semanas)</CardTitle></CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyProductivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Concluídas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* Tarefas por Colaborador */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tarefas Concluídas por Colaborador</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tasksByCollaborator.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Atrasadas por Colaborador */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-destructive" />Atrasadas por Colaborador</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Colaborador</TableHead><TableHead className="text-right">Atrasadas</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {overdueByCollaborator.map(r => (
                      <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right"><Badge variant="destructive">{r.count}</Badge></TableCell></TableRow>
                    ))}
                    {!overdueByCollaborator.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhuma atrasada</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Retrabalho */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><RefreshCw className="w-4 h-4" />Retrabalho</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Colaborador</TableHead><TableHead className="text-right">Rejeições</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {reworkByCollaborator.map(r => (
                      <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right">{r.count}</TableCell></TableRow>
                    ))}
                    {!reworkByCollaborator.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">—</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Nota Média */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Star className="w-4 h-4" />Nota Média</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Colaborador</TableHead><TableHead className="text-right">Média</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {avgRatingByCollaborator.map(r => (
                      <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right font-medium">{r.avg}</TableCell></TableRow>
                    ))}
                    {!avgRatingByCollaborator.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">—</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Gargalos */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><ShieldAlert className="w-4 h-4" />Gargalos (bloqueios)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Colaborador</TableHead><TableHead className="text-right">Bloqueios</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {bottlenecksByCollaborator.map(r => (
                      <TableRow key={r.name}><TableCell>{r.name}</TableCell><TableCell className="text-right">{r.count}</TableCell></TableRow>
                    ))}
                    {!bottlenecksByCollaborator.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">—</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════ ABA CLIENTE ═══════════ */}
        <TabsContent value="cliente" className="space-y-4">
          <div className="flex items-center justify-between">
            <FilterBar
              period={clPeriod} setPeriod={setClPeriod}
              squadId={clSquad} setSquadId={setClSquad}
              responsible={clResponsible} setResponsible={setClResponsible}
              platformSlug={clPlatform} setPlatformSlug={setClPlatform}
              squads={squads} appUsers={appUsers} platforms={platforms}
              showClientFilter clientId={clClientId} setClientId={setClClientId} clients={activeClients}
            />
            <Button size="sm" variant="outline" onClick={handleExportClientPdf} disabled={loading || !selectedClient}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
            </Button>
          </div>

          {!selectedClient ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Selecione um cliente para ver o relatório detalhado.</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                <KpiCard label="Tarefas Abertas" value={clientTasksSummary.open} icon={FileText} />
                <KpiCard label="Tarefas Concluídas" value={clientTasksSummary.done} icon={BarChart3} />
                <KpiCard label="Plataformas" value={clientPlatformsList.length} icon={Building2} />
                <KpiCard label="Risco de Churn" value={selectedClient.riscoChurn || 'baixo'} icon={AlertTriangle} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tarefas abertas vs concluídas */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Tarefas: Abertas vs Concluídas</CardTitle></CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Abertas', value: clientTasksSummary.open },
                            { name: 'Concluídas', value: clientTasksSummary.done },
                          ]}
                          cx="50%" cy="50%" outerRadius={80} dataKey="value" label
                        >
                          <Cell fill="hsl(var(--warning))" />
                          <Cell fill="hsl(var(--success))" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Plataformas do cliente */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Plataformas</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow><TableHead>Plataforma</TableHead><TableHead>Fase</TableHead><TableHead>Status</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {clientPlatformsList.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{platforms.find(pl => pl.slug === p.platformSlug)?.name || p.platformSlug}</TableCell>
                            <TableCell>{p.phase}</TableCell>
                            <TableCell><Badge variant="outline">{p.platformStatus}</Badge></TableCell>
                            <TableCell>{p.responsible}</TableCell>
                          </TableRow>
                        ))}
                        {!clientPlatformsList.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem plataformas</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Motivos de atraso */}
              {clientDelayReasons.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Motivos de Atraso</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {clientDelayReasons.map(r => (
                        <Badge key={r.name} variant="secondary">{r.name} ({r.count})</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Health Score */}
              {canViewHealth(currentUser) && healthScores[selectedClient.id] && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Saúde do Cliente</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white',
                        healthScores[selectedClient.id].color === 'green' ? 'bg-green-500' :
                        healthScores[selectedClient.id].color === 'yellow' ? 'bg-yellow-500' :
                        healthScores[selectedClient.id].color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                      )}>
                        {healthScores[selectedClient.id].score}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Score: {healthScores[selectedClient.id].score}/100</p>
                        <p>Classificação: {healthScores[selectedClient.id].color === 'green' ? '🟢 Saudável' : healthScores[selectedClient.id].color === 'yellow' ? '🟡 Atenção' : healthScores[selectedClient.id].color === 'red' ? '🔴 Crítico' : '⚪ Sem dados'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ═══════════ ABA EXECUTIVO ═══════════ */}
        <TabsContent value="executivo" className="space-y-4">
          {!canSeeExecutive ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Acesso restrito a coordenadores e administradores.</CardContent></Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <FilterBar period={exPeriod} setPeriod={setExPeriod} squadId={exSquad} setSquadId={setExSquad} responsible={exResponsible} setResponsible={setExResponsible} platformSlug={exPlatform} setPlatformSlug={setExPlatform} squads={squads} appUsers={appUsers} platforms={platforms} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleExportExecutivePdf} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <KpiCard label="Clientes Ativos" value={exFilteredClients.length} icon={Building2} />
                <KpiCard label="Backlog Total" value={tasks.filter(t => t.status === 'backlog').length} icon={FileText} />
                <KpiCard label="NPS Score" value={npsData.score != null ? npsData.score : '—'} icon={TrendingUp} />
                {canSeeFinancial && (
                  <KpiCard label="MRR Total" value={`R$ ${exFilteredClients.reduce((s, c) => s + (c.monthlyRevenue || 0), 0).toLocaleString('pt-BR')}`} icon={BarChart3} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Backlog por Squad */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Backlog por Squad</CardTitle></CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={backlogBySquad}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Saúde da Carteira */}
                {canViewHealth(currentUser) && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Saúde da Carteira</CardTitle></CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={healthDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                            {healthDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* MRR por Plataforma (financial only) */}
              {canSeeFinancial && mrrByPlatform.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">MRR por Plataforma</CardTitle></CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mrrByPlatform}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                        <Bar dataKey="value" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* NPS Detalhado */}
              {npsData.total > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">NPS Consolidado</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className={cn('text-4xl font-bold', (npsData.score ?? 0) >= 50 ? 'text-green-600' : (npsData.score ?? 0) >= 0 ? 'text-yellow-600' : 'text-red-600')}>
                          {npsData.score}
                        </p>
                        <p className="text-xs text-muted-foreground">NPS Score</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div><p className="text-lg font-bold text-green-600">{npsData.promoters}</p><p className="text-xs text-muted-foreground">Promotores (9-10)</p></div>
                        <div><p className="text-lg font-bold text-yellow-600">{npsData.passives}</p><p className="text-xs text-muted-foreground">Neutros (7-8)</p></div>
                        <div><p className="text-lg font-bold text-red-600">{npsData.detractors}</p><p className="text-xs text-muted-foreground">Detratores (0-6)</p></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clientes em risco de churn */}
              {churnRiskClients.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-destructive" />Clientes em Risco de Churn</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Risco</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Fase</TableHead>
                          {canSeeFinancial && <TableHead className="text-right">MRR</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {churnRiskClients.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell><Badge variant={c.riscoChurn === 'critico' ? 'destructive' : 'secondary'}>{c.riscoChurn}</Badge></TableCell>
                            <TableCell>{c.responsible}</TableCell>
                            <TableCell>{c.faseMacro}</TableCell>
                            {canSeeFinancial && <TableCell className="text-right">{c.monthlyRevenue ? `R$ ${c.monthlyRevenue.toLocaleString('pt-BR')}` : '—'}</TableCell>}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
