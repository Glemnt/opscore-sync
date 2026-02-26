import {
  Users, FolderKanban, CheckSquare, AlertTriangle,
  TrendingUp, Clock, ArrowUpRight, Activity
} from 'lucide-react';
import { clients as allClients, projects as allProjects, tasks as allTasks, teamMembers } from '@/data/mockData';
import { PageHeader, StatCard, StatusBadge, Avatar, ProgressBar } from '@/components/ui/shared';
import { projectStatusConfig, priorityConfig } from '@/lib/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

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

export function DashboardPage() {
  const { getVisibleClients } = useAuth();
  const clients = getVisibleClients();
  const visibleClientIds = new Set(clients.map((c) => c.id));
  const projects = allProjects.filter((p) => visibleClientIds.has(p.clientId));
  const tasks = allTasks.filter((t) => visibleClientIds.has(t.clientId));

  const activeClients = clients.filter(c => c.status === 'active').length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const lateTasks = tasks.filter(t => {
    const isLate = new Date(t.deadline) < new Date() && t.status !== 'done';
    return isLate;
  }).length;
  const waitingTasks = tasks.filter(t => t.status === 'waiting_client').length;

  const overloadedMembers = teamMembers.filter(m => m.currentLoad >= 8);
  const recentProjects = projects.slice(0, 4);

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da operação em tempo real"
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Clientes Ativos"
          value={activeClients}
          icon={<Users className="w-5 h-5 text-primary" />}
          trend={{ value: '+2 esse mês', positive: true }}
          accent="bg-primary-light"
        />
        <StatCard
          label="Projetos em Andamento"
          value={activeProjects}
          icon={<FolderKanban className="w-5 h-5 text-info" />}
          accent="bg-info-light"
        />
        <StatCard
          label="Demandas Atrasadas"
          value={lateTasks}
          icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
          trend={{ value: 'Atenção necessária', positive: false }}
          accent="bg-destructive/10"
        />
        <StatCard
          label="Aguard. Cliente"
          value={waitingTasks}
          icon={<Clock className="w-5 h-5 text-warning" />}
          accent="bg-warning-light"
        />
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
              <Tooltip
                contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 13% 90%)', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: 'hsl(220 20% 97%)' }}
              />
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
        {/* Active projects */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm-custom">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Projetos Ativos</h3>
            <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Ver todos →</span>
          </div>
          <div className="space-y-3">
            {recentProjects.map((project) => {
              const statusConf = projectStatusConfig[project.status];
              const priorityConf = priorityConfig[project.priority];
              return (
                <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      <StatusBadge className={statusConf.className}>{statusConf.label}</StatusBadge>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground">{project.clientName}</p>
                      <span className="text-xs text-muted-foreground">·</span>
                      <p className="text-xs text-muted-foreground">Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <ProgressBar value={project.progress} className="mt-2" />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{project.progress}%</p>
                    <Avatar name={project.responsible} size="sm" className="ml-auto mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
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
                      <span className="text-xs font-medium text-foreground truncate max-w-[90px]">
                        {member.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOverloaded && <AlertTriangle className="w-3 h-3 text-warning" />}
                      <span className={`text-xs font-semibold ${isOverloaded ? 'text-warning' : 'text-muted-foreground'}`}>
                        {member.currentLoad}/10
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOverloaded ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
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
