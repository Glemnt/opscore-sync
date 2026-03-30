import { Trophy, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Filter } from 'lucide-react';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useTasksQuery } from '@/hooks/useTasksQuery';
import { useTaskPausesQuery } from '@/hooks/useTaskPausesQuery';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { useSquadsQuery } from '@/hooks/useSquadsQuery';
import { useUserGoalsQuery } from '@/hooks/useUserGoalsQuery';
import { PageHeader, StatCard, Avatar } from '@/components/ui/shared';
import { Progress } from '@/components/ui/progress';
import { teamRoleConfig } from '@/lib/config';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line,
} from 'recharts';
import { useMemo, useState } from 'react';
import { startOfWeek, startOfMonth, isWithinInterval, format, subWeeks } from 'date-fns';

type PeriodFilter = 'week' | 'month' | 'all';

export function ProductivityPage() {
  const { data: allTeamMembers = [] } = useAppUsersQuery();
  const { data: tasks = [] } = useTasksQuery();
  const { data: pauses = [] } = useTaskPausesQuery();
  const { data: clientPlatforms = [] } = useClientPlatformsQuery();
  const { data: squads = [] } = useSquadsQuery();
  const { data: allGoals = [] } = useUserGoalsQuery();

  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [squadFilter, setSquadFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');

  const now = new Date();
  const periodStart = period === 'week' ? startOfWeek(now, { weekStartsOn: 1 }) :
    period === 'month' ? startOfMonth(now) : new Date(0);

  const isInPeriod = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= periodStart && d <= now;
  };

  // Filter members by squad
  const filteredMembers = allTeamMembers.filter(m => {
    if (squadFilter !== 'all' && !(m.squadIds ?? []).includes(squadFilter)) return false;
    if (memberFilter !== 'all' && m.id !== memberFilter) return false;
    return true;
  });

  const memberMetrics = useMemo(() => {
    return filteredMembers.map(m => {
      const memberTasks = tasks.filter(t => t.responsible === m.name);
      const periodTasks = memberTasks.filter(t => isInPeriod(t.completedAt) || isInPeriod(t.createdAt));
      const completed = memberTasks.filter(t => t.status === 'done' && isInPeriod(t.completedAt));
      const late = memberTasks.filter(t => {
        const deadline = new Date(t.deadline);
        return t.status !== 'done' && deadline < now;
      });
      const currentLoad = memberTasks.filter(t => t.status !== 'done' && t.status !== 'backlog').length;
      const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;

      // Pontualidade: completed before deadline
      const onTime = completed.filter(t => {
        if (!t.completedAt) return true;
        return new Date(t.completedAt) <= new Date(t.deadline + 'T23:59:59');
      });
      const denominator = completed.length + late.length;
      const onTimePct = denominator > 0 ? Math.round((onTime.length / denominator) * 100) : null;
      const deliveryRate = denominator > 0 ? Math.round((completed.length / denominator) * 100) : null;

      // Average resolution time (minutes)
      const tempos = completed.map(t => t.tempoRealMinutos).filter((v): v is number => v != null && v > 0);
      const avgResolutionMin = tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;

      // Average delivery score
      const notas = completed.map(t => t.notaEntrega).filter((v): v is number => v != null);
      const avgNota = notas.length > 0 ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : 0;

      // Rework rate
      const totalEntregas = memberTasks.filter(t => t.status === 'done' || t.status === 'aguardando_aprovacao').length;
      const totalRejections = memberTasks.reduce((a, t) => a + (t.rejectionCount ?? 0), 0);
      const reworkRate = totalEntregas > 0 ? Math.round((totalRejections / totalEntregas) * 100) : 0;

      // Platforms
      const memberPlatforms = clientPlatforms.filter(p => p.responsible === m.name);
      const platformsAtrasadas = memberPlatforms.filter(p => p.deadline && new Date(p.deadline) < now && p.phase !== 'performance');
      const passagens = memberPlatforms.filter(p => p.dataRealPassagem && isInPeriod(p.dataRealPassagem));

      // Weighted score
      const score =
        completed.length * 1 +
        onTime.length * 2 +
        passagens.length * 3 +
        memberPlatforms.filter(p => p.prontaPerformance).length * 2 +
        avgNota * 2 +
        (100 - reworkRate) / 100 * 1;

      return {
        ...m,
        completedTasks: completed.length,
        lateTasks: late.length,
        onTimePct,
        deliveryRate,
        currentLoad,
        inProgress,
        avgResolutionMin,
        avgNota,
        reworkRate,
        platformCount: memberPlatforms.length,
        platformsAtrasadas: platformsAtrasadas.length,
        passagens: passagens.length,
        score: Math.round(score * 10) / 10,
      };
    });
  }, [filteredMembers, tasks, pauses, clientPlatforms, period, now]);

  // Weekly evolution (last 8 weeks)
  const weeklyData = useMemo(() => {
    const weeks: { label: string; concluidas: number; noPrazo: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), i);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekTasks = tasks.filter(t => {
        if (t.status !== 'done' || !t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= weekStart && d < weekEnd;
      });
      const noPrazo = weekTasks.filter(t => {
        if (!t.completedAt) return false;
        return new Date(t.completedAt) <= new Date(t.deadline + 'T23:59:59');
      });
      weeks.push({
        label: format(weekStart, 'dd/MM'),
        concluidas: weekTasks.length,
        noPrazo: noPrazo.length,
      });
    }
    return weeks;
  }, [tasks, now]);

  const performanceData = memberMetrics.map(m => ({
    name: m.name.split(' ')[0],
    concluidas: m.completedTasks,
    noPrazo: Math.round(m.completedTasks * (m.onTimePct ?? 0) / 100),
  }));

  const radarData = memberMetrics.slice(0, 6).map(m => ({
    name: m.name.split(' ')[0],
    pontualidade: m.onTimePct ?? 0,
    nota: m.avgNota * 10,
    velocidade: Math.min(100, m.avgResolutionMin > 0 ? Math.round(100 - Math.min(100, m.avgResolutionMin / 5)) : 50),
    qualidade: 100 - m.reworkRate,
  }));

  const totalCompleted = memberMetrics.reduce((a, m) => a + m.completedTasks, 0);
  const totalLate = memberMetrics.reduce((a, m) => a + m.lateTasks, 0);
  const totalOnTime = memberMetrics.reduce((a, m) => {
    const onTimeCount = Math.round(m.completedTasks * (m.onTimePct ?? 0) / 100);
    return a + onTimeCount;
  }, 0);
  const globalDenominator = totalCompleted + totalLate;
  const avgOnTime = globalDenominator > 0 ? Math.round((totalOnTime / globalDenominator) * 100) : null;
  const globalDeliveryRate = globalDenominator > 0 ? Math.round((totalCompleted / globalDenominator) * 100) : null;
  const overloaded = memberMetrics.filter(m => m.currentLoad >= 8).length;

  const sorted = [...memberMetrics].sort((a, b) => b.score - a.score);

  const loadColor = (load: number) => load < 5 ? 'text-success' : load <= 8 ? 'text-warning' : 'text-destructive';
  const loadBg = (load: number) => load < 5 ? 'bg-success' : load <= 8 ? 'bg-warning' : 'bg-destructive';
  const lateColor = (late: number) => late === 0 ? 'text-success' : late <= 2 ? 'text-warning' : 'text-destructive';

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Produtividade"
        subtitle="Métricas de desempenho da equipe (dados em tempo real)"
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-medium">Filtros:</span>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value as PeriodFilter)}
          className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="week">Esta semana</option>
          <option value="month">Este mês</option>
          <option value="all">Todo período</option>
        </select>
        <select
          value={squadFilter}
          onChange={e => setSquadFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="all">Todos squads</option>
          {squads.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={memberFilter}
          onChange={e => setMemberFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="all">Todos colaboradores</option>
          {allTeamMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Tarefas Concluídas" value={totalCompleted} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pontualidade Média" value={avgOnTime != null ? `${avgOnTime}%` : '—'} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Taxa de Entrega" value={globalDeliveryRate != null ? `${globalDeliveryRate}%` : '—'} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Tarefas Atrasadas" value={totalLate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Desempenho por Colaborador</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="concluidas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Concluídas" />
              <Bar dataKey="noPrazo" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} name="No Prazo" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Habilidades Comparativas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={[
              { metric: 'Pontualidade', ...Object.fromEntries(radarData.map(d => [d.name, d.pontualidade])) },
              { metric: 'Nota', ...Object.fromEntries(radarData.map(d => [d.name, d.nota])) },
              { metric: 'Velocidade', ...Object.fromEntries(radarData.map(d => [d.name, d.velocidade])) },
              { metric: 'Qualidade', ...Object.fromEntries(radarData.map(d => [d.name, d.qualidade])) },
            ]}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              {radarData.slice(0, 3).map((d, i) => (
                <Radar key={d.name} dataKey={d.name} stroke={`hsl(var(--${i === 0 ? 'primary' : i === 1 ? 'success' : 'warning'}))`} fill={`hsl(var(--${i === 0 ? 'primary' : i === 1 ? 'success' : 'warning'}))`} fillOpacity={0.15} name={d.name} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Weekly Evolution */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Evolução Semanal</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="concluidas" stroke="hsl(var(--primary))" strokeWidth={2} name="Concluídas" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="noPrazo" stroke="hsl(var(--success))" strokeWidth={2} name="No Prazo" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goals Progress */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Progresso vs Metas Semanais</h3>
        </div>
        <div className="space-y-4">
          {sorted.map(member => {
            const goal = allGoals.find(g => g.userId === member.id && g.period === 'weekly');
            if (!goal) return null;

            const metrics = [
              { label: 'Passagens', current: member.passagens, target: goal.metaPassagens },
              { label: 'Plataformas', current: member.platformCount, target: goal.metaAnunciosCliente },
            ];

            return (
              <div key={member.id} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar name={member.name} size="sm" />
                  <span className="text-sm font-medium text-foreground">{member.name}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Passagens */}
                  {(() => {
                    const pct = goal.metaPassagens > 0 ? Math.round((member.passagens / goal.metaPassagens) * 100) : 0;
                    const emoji = pct >= 100 ? '🟢' : pct >= 60 ? '🟡' : '🔴';
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Passagens</span>
                          <span className="text-xs font-medium">{emoji} {member.passagens}/{goal.metaPassagens}</span>
                        </div>
                        <Progress value={Math.min(100, pct)} className="h-2" />
                      </div>
                    );
                  })()}
                  {/* Destravamentos (use completedTasks as proxy) */}
                  {(() => {
                    const pct = goal.metaDestravamentos > 0 ? Math.round((member.completedTasks / goal.metaDestravamentos) * 100) : 0;
                    const emoji = pct >= 100 ? '🟢' : pct >= 60 ? '🟡' : '🔴';
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Destravamentos</span>
                          <span className="text-xs font-medium">{emoji} {member.completedTasks}/{goal.metaDestravamentos}</span>
                        </div>
                        <Progress value={Math.min(100, pct)} className="h-2" />
                      </div>
                    );
                  })()}
                  {/* Backlog reduction */}
                  {(() => {
                    const backlogReduced = Math.max(0, member.completedTasks - member.lateTasks);
                    const pct = goal.metaReducaoBacklog > 0 ? Math.round((backlogReduced / goal.metaReducaoBacklog) * 100) : 0;
                    const emoji = pct >= 100 ? '🟢' : pct >= 60 ? '🟡' : '🔴';
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Red. Backlog</span>
                          <span className="text-xs font-medium">{emoji} {backlogReduced}/{goal.metaReducaoBacklog}</span>
                        </div>
                        <Progress value={Math.min(100, pct)} className="h-2" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
          {sorted.every(m => !allGoals.find(g => g.userId === m.id && g.period === 'weekly')) && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma meta definida. Configure metas na página de Configurações.</p>
          )}
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Ranking de Produtividade (Ponderado)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left py-2 px-2 font-medium">#</th>
                <th className="text-left py-2 px-2 font-medium">Colaborador</th>
                <th className="text-center py-2 px-1 font-medium">Concluídas</th>
                <th className="text-center py-2 px-1 font-medium">Pontualidade</th>
                <th className="text-center py-2 px-1 font-medium">Tempo Médio</th>
                <th className="text-center py-2 px-1 font-medium">Nota Média</th>
                <th className="text-center py-2 px-1 font-medium">Retrabalho</th>
                <th className="text-center py-2 px-1 font-medium">Carga</th>
                <th className="text-center py-2 px-1 font-medium">Atraso</th>
                <th className="text-center py-2 px-1 font-medium">Plataformas</th>
                <th className="text-center py-2 px-1 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((member, index) => {
                const roleConf = teamRoleConfig[member.role];
                return (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-2">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 ? 'bg-warning/20 text-warning' :
                        index === 1 ? 'bg-muted text-muted-foreground' :
                        index === 2 ? 'bg-warning/10 text-warning/80' :
                        'bg-muted/50 text-muted-foreground'
                      )}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={member.name} size="sm" />
                        <div>
                          <span className="text-sm font-medium text-foreground">{member.name}</span>
                          {roleConf && (
                            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${roleConf.className}`}>
                              {roleConf.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-1 font-medium">{member.completedTasks}</td>
                    <td className="text-center py-2.5 px-1">
                      <span className={cn('font-medium', member.onTimePct == null ? 'text-muted-foreground' : member.onTimePct >= 80 ? 'text-success' : member.onTimePct >= 60 ? 'text-warning' : 'text-destructive')}>
                        {member.onTimePct != null ? `${member.onTimePct}%` : '—'}
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-1 text-muted-foreground">
                      {member.avgResolutionMin > 0 ? `${member.avgResolutionMin}min` : '—'}
                    </td>
                    <td className="text-center py-2.5 px-1">
                      <span className={cn('font-medium', member.avgNota >= 8 ? 'text-success' : member.avgNota >= 5 ? 'text-warning' : 'text-muted-foreground')}>
                        {member.avgNota > 0 ? member.avgNota.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-1">
                      <span className={cn('font-medium', member.reworkRate === 0 ? 'text-success' : member.reworkRate <= 20 ? 'text-warning' : 'text-destructive')}>
                        {member.reworkRate}%
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-1">
                      <div className="flex items-center justify-center gap-1">
                        <span className={cn('w-2 h-2 rounded-full', loadBg(member.currentLoad))} />
                        <span className={cn('text-xs font-medium', loadColor(member.currentLoad))}>
                          {member.currentLoad}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-1">
                      <span className={cn('text-xs font-medium', lateColor(member.lateTasks))}>
                        {member.lateTasks}
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-1 text-muted-foreground">
                      {member.platformCount}
                      {member.platformsAtrasadas > 0 && (
                        <span className="text-destructive ml-1">({member.platformsAtrasadas}⚠)</span>
                      )}
                    </td>
                    <td className="text-center py-2.5 px-1">
                      <span className="font-bold text-primary">{member.score}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
