import { Trophy, TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { useTeamMembersQuery } from '@/hooks/useTeamMembersQuery';
import { PageHeader, StatCard, Avatar } from '@/components/ui/shared';
import { teamRoleConfig } from '@/lib/config';
import { TeamMember } from '@/types';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientsContext';

export function ProductivityPage() {
  const { currentUser } = useAuth();
  const { getVisibleClients } = useClients();
  const clients = getVisibleClients();
  const { data: allTeamMembers = [] } = useTeamMembersQuery();

  // Filter team members by visible squads
  const visibleSquadIds = new Set(clients.map((c) => c.squadId).filter(Boolean));
  const isAdmin = currentUser?.accessLevel === 3;
  const teamMembers = isAdmin ? allTeamMembers : allTeamMembers.filter((m) => !m.squadId || visibleSquadIds.has(m.squadId));

  const performanceData = teamMembers.map(m => ({
    name: m.name.split(' ')[0],
    concluidas: m.completedTasks,
    pontualidade: m.onTimePct,
  }));

  const totalCompleted = teamMembers.reduce((a, m) => a + m.completedTasks, 0);
  const avgOnTime = teamMembers.length > 0 ? Math.round(teamMembers.reduce((a, m) => a + m.onTimePct, 0) / teamMembers.length) : 0;
  const totalLate = teamMembers.reduce((a, m) => a + m.lateTasks, 0);
  const overloaded = teamMembers.filter(m => m.currentLoad >= 8).length;

  const sorted = [...teamMembers].sort((a, b) => b.completedTasks - a.completedTasks);

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Produtividade"
        subtitle="Métricas de desempenho da equipe"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Tarefas Concluídas" value={totalCompleted} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pontualidade Média" value={`${avgOnTime}%`} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Tarefas Atrasadas" value={totalLate} />
        <StatCard icon={<Target className="w-5 h-5" />} label="Sobrecarregados" value={overloaded} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Chart */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Tarefas Concluídas por Membro</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="concluidas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Concluídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Pontualidade (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Radar dataKey="pontualidade" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} name="Pontualidade" />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm-custom">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Ranking de Produtividade</h3>
        </div>
        <div className="space-y-3">
          {sorted.map((member, index) => {
            const roleConf = teamRoleConfig[member.role];
            const loadPct = Math.min(100, (member.currentLoad / 10) * 100);
            const isOverloaded = member.currentLoad >= 8;
            return (
              <div key={member.id} className="flex items-center gap-4 py-2">
                <span className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                  index === 0 ? 'bg-warning/20 text-warning' :
                  index === 1 ? 'bg-muted text-muted-foreground' :
                  index === 2 ? 'bg-warning/10 text-warning/80' :
                  'bg-muted/50 text-muted-foreground'
                )}>
                  {index + 1}
                </span>
                <Avatar name={member.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{member.name}</span>
                    {roleConf && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${roleConf.className}`}>
                        {roleConf.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{member.completedTasks} concluídas</span>
                    <span>{member.onTimePct}% pontual</span>
                    <span className={isOverloaded ? 'text-warning font-semibold' : ''}>
                      {member.currentLoad}/10 carga
                    </span>
                  </div>
                </div>
                <div className="w-20">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isOverloaded ? 'bg-destructive' : 'bg-primary'
                      )}
                      style={{ width: `${loadPct}%` }}
                    />
                  </div>
                </div>
                {index < 3 && (
                  <TrendingUp className="w-4 h-4 text-success" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
