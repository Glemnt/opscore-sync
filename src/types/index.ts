export type ClientStatus = 'active' | 'paused' | 'churned' | 'onboarding';
export type ProjectStatus = 'backlog' | 'in_progress' | 'waiting_client' | 'done';
export type TaskStatus = 'backlog' | 'in_progress' | 'waiting_client' | 'done';
export type Priority = 'high' | 'medium' | 'low';
export type TaskType = 'anuncio' | 'copy' | 'design' | 'otimizacao' | 'analise' | 'setup' | 'reuniao' | 'relatorio' | (string & {});
export type ProjectType = 'criacao_anuncio' | 'setup_campanha' | 'otimizacao' | 'relatorio' | 'redesign' | 'consultoria';
export type TeamRole = 'cs' | 'operacional' | 'design' | 'copy' | 'gestao';
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
  contractFile?: { name: string; url: string; uploadedAt: string };
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
  subtasks?: SubTask[];
  chatNotes?: ChatNote[];
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
