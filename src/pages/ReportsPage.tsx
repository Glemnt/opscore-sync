import { FileText, Download, Users, Building2, Tag, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';
import { clients, teamMembers, tasks } from '@/data/mockData';
import { teamRoleConfig, taskTypeConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

const reportCards = [
  {
    icon: Users,
    title: 'Relatório Semanal da Equipe',
    description: 'Produtividade, tarefas concluídas e pontualidade por colaborador na última semana.',
    color: 'bg-primary-light text-primary',
    tag: 'Semanal',
    tagColor: 'bg-primary/10 text-primary',
  },
  {
    icon: Building2,
    title: 'Relatório por Cliente',
    description: 'Volume de demandas, projetos ativos, tempo gasto e status geral por cliente.',
    color: 'bg-info-light text-info',
    tag: 'Por cliente',
    tagColor: 'bg-info-light text-info',
  },
  {
    icon: Tag,
    title: 'Relatório por Tipo de Tarefa',
    description: 'Distribuição e tempo médio por tipo: anúncio, copy, design, otimização, etc.',
    color: 'bg-warning-light text-warning',
    tag: 'Por categoria',
    tagColor: 'bg-warning-light text-warning',
  },
  {
    icon: BarChart3,
    title: 'Performance por Colaborador',
    description: 'Histórico detalhado de produtividade, pontualidade e evolução por colaborador.',
    color: 'bg-success-light text-success',
    tag: 'Histórico',
    tagColor: 'bg-success-light text-success',
  },
];

export function ReportsPage() {
  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Relatórios"
        subtitle="Geração e exportação de relatórios da operação"
      />

      {/* Report cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-card rounded-xl border border-border p-5 shadow-sm-custom hover:shadow-md-custom transition-all group cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', card.tagColor)}>
                  {card.tag}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{card.description}</p>
              <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Download className="w-3.5 h-3.5" />
                Gerar relatório
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick summary tables */}
      <div className="grid grid-cols-2 gap-4">
        {/* By client */}
        <div className="bg-card rounded-xl border border-border shadow-sm-custom overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Resumo por Cliente</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Cliente', 'Projetos', 'Demandas'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground py-2.5 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.filter(c => c.status === 'active').map(client => (
                <tr key={client.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-4 text-sm text-foreground font-medium">{client.name}</td>
                  <td className="py-2.5 px-4 text-sm text-muted-foreground">{client.activeProjects}</td>
                  <td className="py-2.5 px-4 text-sm text-muted-foreground">{client.pendingTasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By type */}
        <div className="bg-card rounded-xl border border-border shadow-sm-custom overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Tarefas por Tipo</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Tipo', 'Qtd', 'Tempo Médio'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground py-2.5 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(taskTypeConfig).map(([type, conf]) => {
                const typeTasks = tasks.filter(t => t.type === type);
                const avgTime = typeTasks.length > 0
                  ? (typeTasks.reduce((a, t) => a + t.estimatedTime, 0) / typeTasks.length).toFixed(1)
                  : '—';
                return (
                  <tr key={type} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', conf.color)}>
                        {conf.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{typeTasks.length}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{avgTime}h</td>
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
