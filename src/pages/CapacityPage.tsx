import { useState, useMemo } from 'react';
import { Users, Calculator, CalendarDays, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useTasksQuery } from '@/hooks/useTasksQuery';
import { useMilestonesQuery, useUpdateMilestone, MILESTONE_TYPE_LABELS, MILESTONE_STATUS_LABELS } from '@/hooks/useScheduledMilestonesQuery';
import { useClientsQuery } from '@/hooks/useClientsQuery';
import { PageHeader } from '@/components/ui/shared';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getOccupationColor(pct: number) {
  if (pct >= 90) return 'text-destructive';
  if (pct >= 70) return 'text-yellow-500';
  return 'text-green-500';
}

function getOccupationEmoji(pct: number) {
  if (pct >= 90) return '🔴';
  if (pct >= 70) return '🟡';
  return '🟢';
}

function getBarColor(pct: number) {
  if (pct >= 90) return 'hsl(var(--destructive))';
  if (pct >= 70) return '#eab308';
  return '#22c55e';
}

export function CapacityPage() {
  const { data: users = [] } = useAppUsersQuery();
  const { data: tasks = [] } = useTasksQuery();
  const { data: milestones = [] } = useMilestonesQuery();
  const { data: clients = [] } = useClientsQuery();
  const updateMilestone = useUpdateMilestone();

  const [simNewClients, setSimNewClients] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [filterResponsible, setFilterResponsible] = useState('all');

  // Active tasks per user
  const activeStatuses = ['backlog', 'in_progress', 'waiting_client', 'em_andamento', 'aguardando_cliente'];
  const userLoad = useMemo(() => {
    const map: Record<string, { current: number; projected7: number; projected15: number; projected30: number }> = {};
    const now = new Date();
    const d7 = addDays(now, 7);
    const d15 = addDays(now, 15);
    const d30 = addDays(now, 30);

    users.forEach(u => {
      const userTasks = tasks.filter(t => t.responsible === u.name && activeStatuses.includes(t.status));
      const current = userTasks.length;
      const projected7 = tasks.filter(t => t.responsible === u.name && new Date(t.deadline) <= d7 && activeStatuses.includes(t.status)).length;
      const projected15 = tasks.filter(t => t.responsible === u.name && new Date(t.deadline) <= d15 && activeStatuses.includes(t.status)).length;
      const projected30 = tasks.filter(t => t.responsible === u.name && new Date(t.deadline) <= d30 && activeStatuses.includes(t.status)).length;
      map[u.id] = { current, projected7, projected15, projected30 };
    });
    return map;
  }, [users, tasks]);

  // Average tasks per client
  const avgTasksPerClient = useMemo(() => {
    if (clients.length === 0) return 6;
    return Math.max(1, Math.round(tasks.length / Math.max(clients.length, 1)));
  }, [tasks, clients]);

  // Simulation
  const simulation = useMemo(() => {
    if (simNewClients <= 0) return [];
    const totalNewTasks = simNewClients * avgTasksPerClient;
    const operationalUsers = users.filter(u => !['ceo', 'coo', 'head'].includes(u.role));
    if (operationalUsers.length === 0) return [];
    const perUser = Math.ceil(totalNewTasks / operationalUsers.length);
    return operationalUsers.map(u => {
      const current = userLoad[u.id]?.current ?? 0;
      const newLoad = current + perUser;
      const pct = Math.round((newLoad / u.maxCapacity) * 100);
      return { name: u.name, currentLoad: current, newLoad, maxCapacity: u.maxCapacity, pct, overloaded: pct > 90 };
    });
  }, [simNewClients, users, userLoad, avgTasksPerClient]);

  // Chart data
  const chartData = useMemo(() => {
    return users
      .filter(u => !['ceo', 'coo'].includes(u.role))
      .map(u => ({
        name: u.name.split(' ')[0],
        carga: userLoad[u.id]?.current ?? 0,
        max: u.maxCapacity,
        pct: Math.round(((userLoad[u.id]?.current ?? 0) / u.maxCapacity) * 100),
      }));
  }, [users, userLoad]);

  // Calendar
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const filteredMilestones = useMemo(() => {
    if (filterResponsible === 'all') return milestones;
    return milestones.filter(m => m.responsible === filterResponsible);
  }, [milestones, filterResponsible]);

  const milestonesByDay = useMemo(() => {
    const map: Record<string, typeof milestones> = {};
    filteredMilestones.forEach(m => {
      const key = m.scheduledDate;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [filteredMilestones]);

  const overloadedCount = simulation.filter(s => s.overloaded).length;

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <PageHeader title="Capacidade da Equipe" subtitle="Visualize carga, simule cenários e acompanhe marcos agendados" />

      {/* Collaborator Table */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> Visão por Colaborador
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-center">Carga Atual</TableHead>
                <TableHead className="text-center">Max</TableHead>
                <TableHead className="text-center">% Ocupação</TableHead>
                <TableHead className="text-center">7d</TableHead>
                <TableHead className="text-center">15d</TableHead>
                <TableHead className="text-center">30d</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.filter(u => !['ceo', 'coo'].includes(u.role)).map(u => {
                const load = userLoad[u.id] ?? { current: 0, projected7: 0, projected15: 0, projected30: 0 };
                const pct = Math.round((load.current / u.maxCapacity) * 100);
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-center">{load.current}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{u.maxCapacity}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Progress value={Math.min(pct, 100)} className="w-16 h-2" />
                        <span className={cn('text-xs font-bold', getOccupationColor(pct))}>{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">{load.projected7}</TableCell>
                    <TableCell className="text-center text-xs">{load.projected15}</TableCell>
                    <TableCell className="text-center text-xs">{load.projected30}</TableCell>
                    <TableCell className="text-center">{getOccupationEmoji(pct)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Carga Atual vs Capacidade</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} width={55} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [value, name === 'carga' ? 'Carga' : 'Máximo']}
                />
                <Bar dataKey="max" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="carga" radius={[0, 4, 4, 0]} barSize={14}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.pct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Simulator */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Simulador de Capacidade
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantos clientes novos?</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={simNewClients}
                onChange={e => setSimNewClients(Number(e.target.value))}
                placeholder="Ex: 10"
              />
              <p className="text-xs text-muted-foreground">Média: ~{avgTasksPerClient} tarefas por cliente</p>
            </div>

            {simNewClients > 0 && (
              <div className="space-y-3">
                {overloadedCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive font-medium">
                      {overloadedCount} colaborador{overloadedCount > 1 ? 'es' : ''} ficaria{overloadedCount > 1 ? 'm' : ''} sobrecarregado{overloadedCount > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {simulation.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{s.currentLoad}→{s.newLoad}/{s.maxCapacity}</span>
                        <span className={cn('text-xs font-bold', getOccupationColor(s.pct))}>{s.pct}%</span>
                        <span>{getOccupationEmoji(s.pct)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Milestones Calendar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Calendário de Marcos
          </h3>
          <div className="flex items-center gap-3">
            <Select value={filterResponsible} onValueChange={setFilterResponsible}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Filtrar responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
          {/* Leading empty cells */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-card p-2 min-h-[70px]" />
          ))}
          {calDays.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayMilestones = milestonesByDay[key] ?? [];
            const count = dayMilestones.length;
            return (
              <div
                key={key}
                className={cn(
                  'bg-card p-1.5 min-h-[70px] relative',
                  isToday(day) && 'ring-2 ring-primary ring-inset'
                )}
              >
                <span className={cn('text-xs font-medium', isToday(day) ? 'text-primary font-bold' : 'text-foreground')}>
                  {day.getDate()}
                </span>
                {count > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayMilestones.slice(0, 2).map(m => (
                      <div
                        key={m.id}
                        className={cn(
                          'text-[9px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer',
                          m.status === 'realizado' ? 'bg-green-500/20 text-green-700' :
                          m.status === 'cancelado' ? 'bg-muted text-muted-foreground line-through' :
                          m.status === 'reagendado' ? 'bg-yellow-500/20 text-yellow-700' :
                          'bg-primary/10 text-primary'
                        )}
                        title={`${m.title} — ${m.responsible} (${MILESTONE_STATUS_LABELS[m.status]})`}
                        onClick={() => {
                          if (m.status === 'pendente') {
                            updateMilestone.mutate({ id: m.id, updates: { status: 'realizado', actualDate: format(new Date(), 'yyyy-MM-dd') } });
                          }
                        }}
                      >
                        {m.title}
                      </div>
                    ))}
                    {count > 2 && (
                      <span className="text-[9px] text-muted-foreground">+{count - 2} mais</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Milestone Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Pendente</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Realizado</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Reagendado</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-muted-foreground" /> Cancelado</span>
        </div>
      </Card>
    </div>
  );
}
