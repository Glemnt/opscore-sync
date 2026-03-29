export type ClientStatus = 'active' | 'onboarding' | 'implementacao' | 'escala' | 'performance' | 'inativo' | (string & {});
export type FaseMacro = 'implementacao' | 'performance' | 'escala' | 'pausado' | 'cancelado' | 'inativo';
export type SubStatus = 'onboard' | 'implementacao_ativa' | 'validacao_final' | null;
export type PerfilCliente = 'brasileiro' | 'boliviano' | 'outro';
export type StatusFinanceiro = 'em_dia' | 'atrasado' | 'inadimplente';
export type RiscoChurn = 'baixo' | 'medio' | 'alto' | 'critico';
export type TipoCliente = 'seller' | 'lojista';
export type PrioridadeGeral = 'P1' | 'P2' | 'P3' | 'P4';
export type ProjectStatus = 'backlog' | 'in_progress' | 'waiting_client' | 'done';
export type TaskStatus = 'backlog' | 'in_progress' | 'waiting_client' | 'done' | (string & {});
export type Priority = 'high' | 'medium' | 'low';
export type TaskType = 'anuncio' | 'copy' | 'design' | 'otimizacao' | 'analise' | 'setup' | 'reuniao' | 'relatorio' | (string & {});
export type ProjectType = 'criacao_anuncio' | 'setup_campanha' | 'otimizacao' | 'relatorio' | 'redesign' | 'consultoria';
export type TeamRole = 'cs' | 'operacional' | 'design' | 'copy' | 'gestao' | 'auxiliar_ecommerce' | 'assistente_ecommerce' | 'manager' | 'head' | 'coo' | 'ceo';
export type ContractType = 'mrr' | 'tcv';
export type Platform = string;

export interface ChangeLogEntry {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export interface ChatNote {
  id: string;
  message: string;
  author: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  segment: string;
  responsible: string;
  squadId: string;
  startDate: string;
  status: ClientStatus;
  notes: string;
  logo?: string;
  monthlyRevenue?: number;
  activeProjects: number;
  pendingTasks: number;
  contractType: ContractType;
  paymentDay: number;
  contractDurationMonths?: number; // only for TCV
  platform?: Platform;
  platforms?: Platform[];
  healthColor?: 'green' | 'yellow' | 'red' | 'white';
  phase?: string;
  setupFee?: number;
  phone?: string;
  cnpj?: string;
  email?: string;
  origin?: string;
  contractFile?: { name: string; url: string; uploadedAt: string };
  // New expanded fields
  razaoSocial?: string;
  perfilCliente?: PerfilCliente;
  endereco?: string;
  cidade?: string;
  estado?: string;
  logisticaPrincipal?: string;
  nomeProprietario?: string;
  cpfResponsavel?: string;
  csResponsavel?: string;
  manager?: string;
  auxiliar?: string;
  assistente?: string;
  consultorAtual?: string;
  vendedor?: string;
  statusFinanceiro?: StatusFinanceiro;
  multaRescisoria?: number;
  dataFimPrevista?: string;
  faseMacro?: FaseMacro;
  subStatus?: SubStatus;
  ultimoContato?: string;
  ultimaRespostaCliente?: string;
  motivoAtrasoGeral?: string;
  riscoChurn?: RiscoChurn;
  tipoCliente?: TipoCliente;
  dataPrevistaPassagem?: string;
  dataRealPassagem?: string;
  prioridadeGeral?: PrioridadeGeral;
  npsUltimo?: number;
  changeLogs: ChangeLogEntry[];
  chatNotes: ChatNote[];
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  type: ProjectType;
  responsible: string;
  startDate: string;
  deadline: string;
  priority: Priority;
  status: ProjectStatus;
  checklist: ChecklistItem[];
  progress: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface SubTask {
  id: string;
  label: string;
  done: boolean;
  checkedBy?: string;
  checkedAt?: string;
}

export type OrigemTarefa = 'automatica' | 'manual' | 'recorrente';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Task {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  responsible: string;
  type: TaskType;
  estimatedTime: number; // hours
  realTime?: number; // hours
  deadline: string;
  status: TaskStatus;
  priority: Priority;
  comments: string;
  createdAt: string;
  platforms?: string[];
  flowId?: string;
  motivoAtraso?: string;
  subtasks?: SubTask[];
  chatNotes?: ChatNote[];
  platformId?: string;
  etapa?: string;
  bloqueiaPassagem?: boolean;
  dependeCliente?: boolean;
  aguardandoCliente?: boolean;
  origemTarefa?: OrigemTarefa;
  linkEntrega?: string;
  printEntrega?: string;
  observacaoEntrega?: string;
  notaEntrega?: number;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectionCount?: number;
  dependsOn?: string[];
  startedAt?: string;
  completedAt?: string;
  tempoRealMinutos?: number;
}

export interface TaskPause {
  id: string;
  taskId: string;
  pauseStart: string;
  pauseEnd: string | null;
  reason: string;
  createdAt: string;
}

export interface Squad {
  id: string;
  name: string;
  leader: string;
  members: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  squadId?: string;
  avatar?: string;
  completedTasks: number;
  avgTime: number; // hours
  lateTasks: number;
  currentLoad: number; // active tasks
  onTimePct: number; // percentage
}

export type AccessLevel = 1 | 2 | 3;

export interface AppUser {
  id: string;
  name: string;
  login: string;
  password: string;
  role: TeamRole;
  accessLevel: AccessLevel;
  squadIds: string[];
}

export interface Flow {
  id: string;
  name: string;
  steps: string[];
  createdAt: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}
