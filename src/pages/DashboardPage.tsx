import { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users, AlertTriangle, TrendingUp, Activity, DollarSign, UserMinus, UserPlus, CalendarIcon
} from 'lucide-react';
import { useTasks } from '@/contexts/TasksContext';
import { useProjectsQuery } from '@/hooks/useProjectsQuery';
import { useTeamMembersQuery } from '@/hooks/useTeamMembersQuery';
import { PageHeader, StatCard, StatusBadge, Avatar, ProgressBar } from '@/components/ui/shared';
import { projectStatusConfig, priorityConfig } from '@/lib/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useClients } from '@/contexts/ClientsContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';

const weeklyData = [
  { day: 'Seg', concluidas: 8, abertas: 3 },
  { day: 'Ter', concluidas: 12, abertas: 5 },
  { day: 'Qua', concluidas: 7, abertas: 8 },
  { day: 'Qui', concluidas: 15, abertas: 4 },
  { day: 'Sex', concluidas: 11, abertas: 6 },
  { day: 'Sab', concluidas: 4, abertas: 1 },
  { day: 'Dom', concluidas: 2, abertas: 0 },
];

const taskTypeData = [
  { name: 'Anúncio', value: 28, color: '#6366f1' },
  { name: 'Design', value: 22, color: '#ec4899' },
  { name: 'Copy', value: 18, color: '#8b5cf6' },
  { name: 'Análise', value: 15, color: '#06b6d4' },
  { name: 'Outros', value: 17, color: '#94a3b8' },
];

// Platform labels now come from the platforms query - see usePlatformsQuery
const PLATFORM_COLORS: Record<string, string> = {
  mercado_livre: '#ffe600',
  shopee: '#ee4d2d',
  shein: '#000000',
};

function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange }: {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartChange: (d: Date | undefined) => void;
  onEndChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", !startDate && "text-muted-foreground")}>
            <CalendarIcon className="w-3 h-3" />
            {startDate ? format(startDate, 'dd/MM/yy') : 'Início'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={startDate} onSelect={onStartChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
      <span className="text-xs text-muted-foreground">—</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", !endDate && "text-muted-foreground")}>
            <CalendarIcon className="w-3 h-3" />
            {endDate ? format(endDate, 'dd/MM/yy') : 'Fim'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={endDate} onSelect={onEndChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DashboardPage() {
  const { getVisibleClients, clients: allClientsList } = useClients();
  const clients = getVisibleClients();
  const { data: allProjects = [] } = useProjectsQuery();
  const { data: platformsList = [] } = usePlatformsQuery();
  const platformLabels = useMemo(() => {
    const map: Record<string, string> = {};
    platformsList.forEach(p => { map[p.slug] = p.name; });
    return map;
  }, [platformsList]);
  const { tasks: allTasks } = useTasks();
  const { data: allTeamMembers = [] } = useTeamMembersQuery();
  const visibleClientIds = new Set(clients.map((c) => c.id));
  const projects = allProjects.filter((p) => visibleClientIds.has(p.clientId));
  const tasks = allTasks.filter((t) => visibleClientIds.has(t.clientId));
  const visibleSquadIds = new Set(clients.map((c) => c.squadId).filter(Boolean));
  const teamMembers = allTeamMembers.filter((m) => !m.squadId || visibleSquadIds.has(m.squadId));

  // Date filters
  const now = new Date();
  const [clientsStartDate, setClientsStartDate] = useState<Date | undefined>(startOfMonth(now));
  const [clientsEndDate, setClientsEndDate] = useState<Date | undefined>(endOfMonth(now));
  const [churnStartDate, setChurnStartDate] = useState<Date | undefined>(startOfMonth(now));
  const [churnEndDate, setChurnEndDate] = useState<Date | undefined>(endOfMonth(now));

  const activeClients = clients.filter(c => c.status !== 'churned').length;
  const lateTasks = tasks.filter(t => {
    const isLate = new Date(t.deadline) < new Date() && t.status !== 'done';
    return isLate;
  }).length;

  // Health summary
  const healthSummary = useMemo(() => {
    const active = clients.filter(c => c.status !== 'churned');
    const counts = { green: 0, yellow: 0, red: 0, white: 0 };
    active.forEach(c => {
      const h = c.healthColor ?? 'white';
      counts[h] = (counts[h] || 0) + 1;
    });
    return counts;
  }, [clients]);

  // Clients by status
  const clientsByStatus = useMemo(() => {
    const counts = { active: 0, onboarding: 0, paused: 0, churned: 0 };
    clients.forEach(c => {
      if (counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [clients]);

  // MRR
  const mrr = useMemo(() => {
    return clients
      .filter(c => c.status !== 'churned')
      .reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  }, [clients]);

  // Clients added in range
  const clientsAdded = useMemo(() => {
    if (!clientsStartDate || !clientsEndDate) return clients.length;
    return clients.filter(c => {
      const d = parseISO(c.startDate);
      return isWithinInterval(d, { start: clientsStartDate, end: clientsEndDate });
    }).length;
  }, [clients, clientsStartDate, clientsEndDate]);

  // Churn in range (filtered by visible clients)
  const churnCount = useMemo(() => {
    const churned = clients.filter(c => c.status === 'churned');
    if (!churnStartDate || !churnEndDate) return churned.length;
    return churned.filter(c => {
      const d = parseISO(c.startDate);
      return isWithinInterval(d, { start: churnStartDate, end: churnEndDate });
    }).length;
  }, [clients, churnStartDate, churnEndDate]);

  // Revenue by platform
  const platformData = useMemo(() => {
    const map: Record<string, number> = {};
    clients.filter(c => c.status !== 'churned').forEach(c => {
      const plats = c.platforms?.length ? c.platforms : (c.platform ? [c.platform] : ['mercado_livre']);
      const rev = (c.monthlyRevenue || 0) / plats.length;
      plats.forEach(p => {
        map[p] = (map[p] || 0) + rev;
      });
    });
    return Object.entries(map).map(([key, value]) => ({
      name: platformLabels[key] || key,
      value: Math.round(value),
      color: PLATFORM_COLORS[key] || '#94a3b8',
    }));
  }, [clients, platformLabels]);

  // Client evolution by month (last 6 months) — filtered by visible clients
  const clientEvolutionData = useMemo(() => {
    const months: { month: string; entradas: number; saidas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const label = format(monthStart, 'MMM/yy', { locale: ptBR });
      const entradas = clients.filter(c => {
        const d = parseISO(c.startDate);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      }).length;
      const saidas = clients.filter(c => {
        if (c.status !== 'churned') return false;
        const d = parseISO(c.startDate);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      }).length;
      months.push({ month: label, entradas, saidas });
    }
    return months;
  }, [clients]);

  const recentProjects = projects.slice(0, 4);

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Visão geral da operação em tempo real" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Clientes Ativos"
          value={activeClients}
          icon={<Users className="w-5 h-5 text-primary" />}
          accent="bg-primary-light"
        />
        <StatCard
          label="MRR"
          value={`R$ ${mrr.toLocaleString('pt-BR')}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          accent="bg-emerald-500/10"
        />
        <StatCard
          label="Demandas Atrasadas"
          value={lateTasks}
          icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
          trend={{ value: 'Atenção necessária', positive: false }}
          accent="bg-destructive/10"
        />
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm-custom">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">Clientes Adicionados</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10"><UserPlus className="w-4 h-4 text-blue-500" /></div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">{clientsAdded}</p>
          <DateRangeFilter startDate={clientsStartDate} endDate={clientsEndDate} onStartChange={setClientsStartDate} onEndChange={setClientsEndDate} />
        </div>
      </div>

      {/* Health Summary */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm-custom mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">Saúde dos Clientes Ativos</h3>
        <div className="flex items-center gap-6">
          {[
            { key: 'green', label: 'Saudável', color: 'bg-emerald-500' },
            { key: 'yellow', label: 'Atenção', color: 'bg-amber-400' },
            { key: 'red', label: 'Crítico', color: 'bg-red-500' },
            { key: 'white', label: 'Não avaliado', color: 'bg-muted-foreground/30' },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-xl font-bold text-foreground">{healthSummary[item.key as keyof typeof healthSummary]}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clients by Stage */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm-custom mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">Clientes por Etapa</h3>
        <div className="space-y-3">
          {([
            { key: 'active', label: 'Ativo', color: 'bg-emerald-500' },
            { key: 'onboarding', label: 'Onboarding', color: 'bg-blue-500' },
            { key: 'paused', label: 'Pausado', color: 'bg-amber-400' },
            { key: 'churned', label: 'Churned', color: 'bg-red-500' },
          ] as const).map(item => {
            const count = clientsByStatus[item.key];
            const total = clients.length || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Churn + Revenue by Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Churn card */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">Churn</span>
            <div className="p-1.5 rounded-lg bg-destructive/10"><UserMinus className="w-4 h-4 text-destructive" /></div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">{churnCount}</p>
          <DateRangeFilter startDate={churnStartDate} endDate={churnEndDate} onStartChange={setChurnStartDate} onEndChange={setChurnEndDate} />
        </div>

        {/* Revenue by Platform */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Receita por Plataforma</h3>
            <p className="text-xs text-muted-foreground">Distribuição de MRR entre plataformas</p>
          </div>
          <div className="flex items-center gap-6">
            <PieChart width={140} height={140}>
              <Pie data={platformData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2}>
                {platformData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
            </PieChart>
            <div className="space-y-2 flex-1">
              {platformData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">R$ {item.value.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Weekly tasks chart */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tarefas da Semana</h3>
              <p className="text-xs text-muted-foreground">Concluídas vs. Abertas</p>
            </div>
            <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded-md font-medium">Esta semana</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 13% 90%)', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: 'hsl(220 20% 97%)' }} />
              <Bar dataKey="concluidas" name="Concluídas" fill="hsl(238 75% 52%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="abertas" name="Abertas" fill="hsl(220 13% 88%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Tipos de Tarefa</h3>
            <p className="text-xs text-muted-foreground">Distribuição atual</p>
          </div>
          <div className="flex justify-center mb-3">
            <PieChart width={140} height={140}>
              <Pie data={taskTypeData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2}>
                {taskTypeData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-1.5">
            {taskTypeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Client evolution chart */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Evolução de Clientes</h3>
              <p className="text-xs text-muted-foreground">Entrada e saída de clientes por mês</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={clientEvolutionData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 13% 90%)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="entradas" name="Entradas" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team workload */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Carga da Equipe</h3>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {teamMembers.slice(0, 6).map((member) => {
              const pct = Math.min(100, (member.currentLoad / 10) * 100);
              const isOverloaded = member.currentLoad >= 8;
              return (
                <div key={member.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar name={member.name} size="sm" />
                      <span className="text-xs font-medium text-foreground truncate max-w-[90px]">{member.name.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOverloaded && <AlertTriangle className="w-3 h-3 text-warning" />}
                      <span className={`text-xs font-semibold ${isOverloaded ? 'text-warning' : 'text-muted-foreground'}`}>{member.currentLoad}/10</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isOverloaded ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}