import { useState } from 'react';
import { FileText, Download, Users, Building2, Tag, BarChart3, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';
import { useClients } from '@/contexts/ClientsContext';
import { useTasks } from '@/contexts/TasksContext';
import { useSquads } from '@/contexts/SquadsContext';
import { useTeamMembersQuery } from '@/hooks/useTeamMembersQuery';
import { useProjectsQuery } from '@/hooks/useProjectsQuery';
import { teamRoleConfig, taskTypeConfig } from '@/lib/config';
import { cn, formatTime } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTeamReport, generateClientReport, generateTaskTypeReport, generateCollaboratorReport } from '@/lib/reportGenerators';
import { TaskType } from '@/types';
import { useTaskTypesQuery } from '@/hooks/useTaskTypesQuery';
import { useClientStatusesQuery } from '@/hooks/useClientStatusesQuery';

const reportCards = [
  {
    id: 'team',
    icon: Users,
    title: 'Relatório Semanal da Equipe',
    description: 'Produtividade, tarefas concluídas e pontualidade por colaborador na última semana.',
    color: 'bg-primary-light text-primary',
    tag: 'Semanal',
    tagColor: 'bg-primary/10 text-primary',
  },
  {
    id: 'client',
    icon: Building2,
    title: 'Relatório por Cliente',
    description: 'Volume de demandas, projetos ativos, tempo gasto e status geral por cliente.',
    color: 'bg-info-light text-info',
    tag: 'Por cliente',
    tagColor: 'bg-info-light text-info',
  },
  {
    id: 'tasktype',
    icon: Tag,
    title: 'Relatório por Tipo de Tarefa',
    description: 'Distribuição e tempo médio por tipo: anúncio, copy, design, otimização, etc.',
    color: 'bg-warning-light text-warning',
    tag: 'Por categoria',
    tagColor: 'bg-warning-light text-warning',
  },
  {
    id: 'collaborator',
    icon: BarChart3,
    title: 'Performance por Colaborador',
    description: 'Histórico detalhado de produtividade, pontualidade e evolução por colaborador.',
    color: 'bg-success-light text-success',
    tag: 'Histórico',
    tagColor: 'bg-success-light text-success',
  },
];

export function ReportsPage() {
  const { toast } = useToast();
  const { clients: allClients, getVisibleClients } = useClients();
  const visibleClients = getVisibleClients();
  const { tasks: allTasks } = useTasks();
  const { squads } = useSquads();
  const { data: allTeamMembers = [] } = useTeamMembersQuery();
  const { data: projects = [] } = useProjectsQuery();
  const { data: dynamicTaskTypes = [] } = useTaskTypesQuery();
  const { data: clientStatuses = [] } = useClientStatusesQuery('clients');

  const churnKeys = new Set(
    clientStatuses.filter(s => s.label.toLowerCase().includes('churn')).map(s => s.key)
  );

  // Filter by visible clients
  const visibleClientIds = new Set(visibleClients.map((c) => c.id));
  const tasks = allTasks.filter((t) => visibleClientIds.has(t.clientId));
  const visibleSquadIds = new Set(visibleClients.map((c) => c.squadId).filter(Boolean));
  const teamMembers = allTeamMembers.filter((m) => !m.squadId || visibleSquadIds.has(m.squadId));
  const [loading, setLoading] = useState(false);
  const [dialogType, setDialogType] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const activeClients = visibleClients.filter(c => !churnKeys.has(c.status));

  const handleCardClick = async (cardId: string) => {
    if (cardId === 'team') {
      setLoading(true);
      try {
        await generateTeamReport(squads, allClients, tasks, projects, teamMembers);
        toast({ title: 'Relatório gerado!', description: 'O PDF da equipe foi baixado com sucesso.' });
      } finally {
        setLoading(false);
      }
    } else {
      setDialogType(cardId);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (dialogType === 'client') {
        const client = allClients.find(c => c.id === selectedClient);
        if (!client) return;
        await generateClientReport(client, tasks, projects);
        toast({ title: 'Relatório gerado!', description: `PDF do cliente ${client.name} baixado.` });
      } else if (dialogType === 'tasktype') {
        await generateTaskTypeReport(selectedTaskType as TaskType, tasks, taskTypeConfig);
        toast({ title: 'Relatório gerado!', description: `PDF do tipo de tarefa baixado.` });
      } else if (dialogType === 'collaborator') {
        const member = teamMembers.find(m => m.id === selectedMember);
        if (!member) return;
        await generateCollaboratorReport(member, tasks, teamRoleConfig);
        toast({ title: 'Relatório gerado!', description: `PDF de ${member.name} baixado.` });
      }
    } finally {
      setLoading(false);
      setDialogType(null);
      setSelectedClient('');
      setSelectedTaskType('');
      setSelectedMember('');
    }
  };

  const canGenerate = () => {
    if (dialogType === 'client') return !!selectedClient;
    if (dialogType === 'tasktype') return !!selectedTaskType;
    if (dialogType === 'collaborator') return !!selectedMember;
    return false;
  };

  const dialogConfig: Record<string, { title: string; description: string }> = {
    client: { title: 'Selecione o Cliente', description: 'Escolha um cliente para gerar o relatório completo.' },
    tasktype: { title: 'Selecione o Tipo de Tarefa', description: 'Escolha o tipo de tarefa para análise detalhada.' },
    collaborator: { title: 'Selecione o Colaborador', description: 'Escolha um colaborador para ver a performance.' },
  };

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
            <div key={card.id} className="bg-card rounded-xl border border-border p-5 shadow-sm-custom hover:shadow-md-custom transition-all group cursor-pointer">
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
              <button
                onClick={() => handleCardClick(card.id)}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {loading && card.id === 'team' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Gerar relatório
              </button>
            </div>
          );
        })}
      </div>

      {/* Selection Dialog */}
      <Dialog open={!!dialogType} onOpenChange={(open) => { if (!open) setDialogType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType && dialogConfig[dialogType]?.title}</DialogTitle>
            <DialogDescription>{dialogType && dialogConfig[dialogType]?.description}</DialogDescription>
          </DialogHeader>

          {dialogType === 'client' && (
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {activeClients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {dialogType === 'tasktype' && (
            <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo de tarefa..." />
              </SelectTrigger>
              <SelectContent>
                {dynamicTaskTypes.map(tt => (
                  <SelectItem key={tt.key} value={tt.key}>{tt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {dialogType === 'collaborator' && (
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colaborador..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name} — {teamRoleConfig[m.role]?.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancelar</Button>
            <Button onClick={handleGenerate} disabled={!canGenerate() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {visibleClients.filter(c => c.status === 'active').map(client => (
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
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{avgTime === '—' ? '—' : formatTime(parseFloat(avgTime))}</td>
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
