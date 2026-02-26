import { Trophy, TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { teamMembers } from '@/data/mockData';
import { PageHeader, StatCard, Avatar } from '@/components/ui/shared';
import { teamRoleConfig } from '@/lib/config';
import { TeamMember } from '@/types';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

const performanceData = teamMembers.map(m => ({
  name: m.name.split(' ')[0],
  concluidas: m.completedTasks,
  pontualidade: m.onTimePct,
}));

const totalCompleted = teamMembers.reduce((a, m) => a + m.completedTasks, 0);
const avgOnTime = Math.round(teamMembers.reduce((a, m) => a + m.onTimePct, 0) / teamMembers.length);
const totalLate = teamMembers.reduce((a, m) => a + m.lateTasks, 0);
const overloaded = teamMembers.filter(m => m.currentLoad >= 8).length;

export function ProductivityPage() {
  const sorted = [...teamMembers].sort((a, b) => b.completedTasks - a.completedTasks);

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Produtividade"
        subtitle="Métricas de desempenho da equipe"
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Concluídas"
          value={totalCompleted}
          icon={<CheckCircle className="w-5 h-5 text-success" />}
          accent="bg-success-light"
          trend={{ value: 'Últimos 30 dias', positive: true }}
        />
        <StatCard
          label="Pontualidade Média"
          value={`${avgOnTime}%`}
          icon={<Target className="w-5 h-5 text-primary" />}
          accent="bg-primary-light"
        />
        <StatCard
          label="Tarefas Atrasadas"
          value={totalLate}
          icon={<AlertTriangle className="w-5 h-5 text-warning" />}
          accent="bg-warning-light"
        />
        <StatCard
          label="Sobrecarregados"
          value={overloaded}
          icon={<TrendingUp className="w-5 h-5 text-destructive" />}
          accent="bg-destructive/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <h3 className="text-sm font-semibold text-foreground mb-1">Tarefas Concluídas por Colaborador</h3>
          <p className="text-xs text-muted-foreground mb-4">Acumulado do mês</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceData} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid hsl(220 13% 90%)', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: 'hsl(220 20% 97%)' }}
              />
              <Bar dataKey="concluidas" name="Concluídas" fill="hsl(238 75% 52%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <h3 className="text-sm font-semibold text-foreground mb-1">Pontualidade por Colaborador</h3>
          <p className="text-xs text-muted-foreground mb-4">% de tarefas entregues no prazo</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 90%)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid hsl(220 13% 90%)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => [`${v}%`, 'Pontualidade']}
                cursor={{ fill: 'hsl(220 20% 97%)' }}
              />
              <Bar dataKey="pontualidade" name="Pontualidade" fill="hsl(142 71% 45%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team ranking table */}
      <div className="bg-card rounded-xl border border-border shadow-sm-custom overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ranking da Equipe</h3>
            <p className="text-xs text-muted-foreground">Ordenado por tarefas concluídas</p>
          </div>
          <Trophy className="w-5 h-5 text-warning" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {['#', 'Colaborador', 'Cargo', 'Concluídas', 'Tempo Médio', 'Atrasadas', 'Carga Atual', 'Pontualidade'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((member, idx) => {
              const roleConf = teamRoleConfig[member.role];
              const isOverloaded = member.currentLoad >= 8;
              return (
                <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                      <span className="text-sm text-muted-foreground font-medium">{idx + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={member.name} size="sm" />
                      <span className="text-sm font-medium text-foreground">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', roleConf.className)}>
                      {roleConf.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-bold text-foreground">{member.completedTasks}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {member.avgTime}h
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'text-sm font-semibold',
                      member.lateTasks > 2 ? 'text-destructive' : member.lateTasks > 0 ? 'text-warning' : 'text-success'
                    )}>
                      {member.lateTasks}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {isOverloaded && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', isOverloaded ? 'bg-warning' : 'bg-primary')}
                          style={{ width: `${Math.min(100, (member.currentLoad / 10) * 100)}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-medium', isOverloaded ? 'text-warning' : 'text-muted-foreground')}>
                        {member.currentLoad}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'text-sm font-bold',
                        member.onTimePct >= 90 ? 'text-success' : member.onTimePct >= 80 ? 'text-warning' : 'text-destructive'
                      )}>
                        {member.onTimePct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
