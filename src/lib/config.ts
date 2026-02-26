import { ClientStatus, Priority, ProjectStatus, TaskStatus, TaskType, ProjectType, TeamRole } from '@/types';

export const clientStatusConfig: Record<ClientStatus, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-success-light text-success border-success/20' },
  paused: { label: 'Pausado', className: 'bg-warning-light text-warning border-warning/20' },
  churned: { label: 'Churned', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  onboarding: { label: 'Onboarding', className: 'bg-info-light text-info border-info/20' },
};

export const projectStatusConfig: Record<ProjectStatus, { label: string; className: string; dot: string }> = {
  backlog: { label: 'Backlog', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-status-backlog' },
  in_progress: { label: 'Em andamento', className: 'bg-info-light text-info border-info/20', dot: 'bg-status-in-progress' },
  waiting_client: { label: 'Aguard. cliente', className: 'bg-warning-light text-warning border-warning/20', dot: 'bg-status-waiting' },
  done: { label: 'Concluído', className: 'bg-success-light text-success border-success/20', dot: 'bg-status-done' },
};

export const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
  backlog: { label: 'Backlog', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'Em andamento', className: 'bg-info-light text-info' },
  waiting_client: { label: 'Aguard. cliente', className: 'bg-warning-light text-warning' },
  done: { label: 'Concluído', className: 'bg-success-light text-success' },
};

export const priorityConfig: Record<Priority, { label: string; className: string; icon: string }> = {
  high: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: '▲' },
  medium: { label: 'Média', className: 'bg-warning-light text-warning border-warning/20', icon: '●' },
  low: { label: 'Baixa', className: 'bg-success-light text-success border-success/20', icon: '▼' },
};

export const taskTypeConfig: Record<TaskType, { label: string; color: string }> = {
  anuncio: { label: 'Anúncio', color: 'bg-blue-100 text-blue-700' },
  copy: { label: 'Copy', color: 'bg-purple-100 text-purple-700' },
  design: { label: 'Design', color: 'bg-pink-100 text-pink-700' },
  otimizacao: { label: 'Otimização', color: 'bg-orange-100 text-orange-700' },
  analise: { label: 'Análise', color: 'bg-cyan-100 text-cyan-700' },
  setup: { label: 'Setup', color: 'bg-indigo-100 text-indigo-700' },
  reuniao: { label: 'Reunião', color: 'bg-slate-100 text-slate-700' },
  relatorio: { label: 'Relatório', color: 'bg-teal-100 text-teal-700' },
};

export const projectTypeConfig: Record<ProjectType, { label: string }> = {
  criacao_anuncio: { label: 'Criação de Anúncios' },
  setup_campanha: { label: 'Setup de Campanha' },
  otimizacao: { label: 'Otimização' },
  relatorio: { label: 'Relatório' },
  redesign: { label: 'Redesign' },
  consultoria: { label: 'Consultoria' },
};

export const teamRoleConfig: Record<TeamRole, { label: string; className: string }> = {
  cs: { label: 'Atendimento/CS', className: 'bg-blue-100 text-blue-700' },
  operacional: { label: 'Operacional', className: 'bg-indigo-100 text-indigo-700' },
  design: { label: 'Design', className: 'bg-pink-100 text-pink-700' },
  copy: { label: 'Copy', className: 'bg-purple-100 text-purple-700' },
  gestao: { label: 'Gestão', className: 'bg-slate-100 text-slate-700' },
};
