import type { Tables } from '@/integrations/supabase/types';
import type {
  Client, Project, Task, Squad, TeamMember,
  ChangeLogEntry, ChatNote, ChecklistItem, SubTask, Flow,
  AccessLevel, TeamRole,
} from '@/types';

// ─── DB Row aliases ───
export type DbClient = Tables<'clients'>;
export type DbProject = Tables<'projects'>;
export type DbTask = Tables<'tasks'>;
export type DbSquad = Tables<'squads'>;
export type DbTeamMember = Tables<'team_members'>;
export type DbAppUser = Tables<'app_users'>;
export type DbChangeLog = Tables<'client_change_logs'>;
export type DbChatNote = Tables<'client_chat_notes'>;
export type DbTaskChatNote = Tables<'task_chat_notes'>;
export type DbSubtask = Tables<'subtasks'>;
export type DbChecklistItem = Tables<'project_checklist_items'>;
export type DbFlow = Tables<'flows'>;
export type DbCustomTemplate = Tables<'custom_templates'>;
export type DbClientFlow = Tables<'client_flows'>;

// ─── Mappers ───

export function mapDbClient(
  row: DbClient,
  changeLogs: DbChangeLog[] = [],
  chatNotes: DbChatNote[] = []
): Client {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    segment: row.segment,
    responsible: row.responsible,
    squadId: row.squad_id ?? '',
    startDate: row.start_date,
    status: row.status,
    notes: row.notes,
    logo: row.logo ?? undefined,
    monthlyRevenue: row.monthly_revenue ?? undefined,
    activeProjects: row.active_projects,
    pendingTasks: row.pending_tasks,
    contractType: row.contract_type,
    paymentDay: row.payment_day,
    contractDurationMonths: row.contract_duration_months ?? undefined,
    platforms: (row.platforms as any) ?? undefined,
    healthColor: row.health_color ?? undefined,
    phase: (row as any).phase ?? 'onboarding',
    setupFee: (row as any).setup_fee ?? undefined,
    phone: (row as any).phone ?? undefined,
    cnpj: (row as any).cnpj ?? undefined,
    email: (row as any).email ?? undefined,
    // New expanded fields
    razaoSocial: (row as any).razao_social ?? '',
    perfilCliente: (row as any).perfil_cliente ?? 'brasileiro',
    endereco: (row as any).endereco ?? '',
    cidade: (row as any).cidade ?? '',
    estado: (row as any).estado ?? '',
    logisticaPrincipal: (row as any).logistica_principal ?? '',
    nomeProprietario: (row as any).nome_proprietario ?? '',
    cpfResponsavel: (row as any).cpf_responsavel ?? '',
    csResponsavel: (row as any).cs_responsavel ?? '',
    manager: (row as any).manager ?? '',
    auxiliar: (row as any).auxiliar ?? '',
    assistente: (row as any).assistente ?? '',
    consultorAtual: (row as any).consultor_atual ?? '',
    vendedor: (row as any).vendedor ?? '',
    statusFinanceiro: (row as any).status_financeiro ?? 'em_dia',
    multaRescisoria: (row as any).multa_rescisoria ?? undefined,
    dataFimPrevista: (row as any).data_fim_prevista ?? undefined,
    faseMacro: (row as any).fase_macro ?? 'implementacao',
    subStatus: (row as any).sub_status ?? null,
    ultimoContato: (row as any).ultimo_contato ?? undefined,
    ultimaRespostaCliente: (row as any).ultima_resposta_cliente ?? undefined,
    motivoAtrasoGeral: (row as any).motivo_atraso_geral ?? '',
    riscoChurn: (row as any).risco_churn ?? 'baixo',
    tipoCliente: (row as any).tipo_cliente ?? 'seller',
    dataPrevistaPassagem: (row as any).data_prevista_passagem ?? undefined,
    dataRealPassagem: (row as any).data_real_passagem ?? undefined,
    prioridadeGeral: (row as any).prioridade_geral ?? 'P2',
    npsUltimo: (row as any).nps_ultimo ?? undefined,
    changeLogs: changeLogs.map(mapDbChangeLog),
    chatNotes: chatNotes.map(mapDbChatNote),
  };
}

export function mapDbChangeLog(row: DbChangeLog): ChangeLogEntry {
  return {
    id: row.id,
    field: row.field,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

export function mapDbChatNote(row: DbChatNote | DbTaskChatNote): ChatNote {
  return {
    id: row.id,
    message: row.message,
    author: row.author,
    createdAt: row.created_at,
  };
}

export function mapDbProject(row: DbProject, checklist: DbChecklistItem[] = []): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    name: row.name,
    type: row.type as any,
    responsible: row.responsible,
    startDate: row.start_date,
    deadline: row.deadline,
    priority: row.priority,
    status: row.status,
    progress: row.progress,
    checklist: checklist
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapDbChecklistItem),
  };
}

export function mapDbChecklistItem(row: DbChecklistItem): ChecklistItem {
  return { id: row.id, label: row.label, done: row.done };
}

export function mapDbTask(
  row: DbTask,
  subtasks: DbSubtask[] = [],
  chatNotes: DbTaskChatNote[] = [],
  dependsOn: string[] = []
): Task {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    clientName: row.client_name,
    projectId: row.project_id ?? undefined,
    projectName: row.project_name ?? undefined,
    responsible: row.responsible,
    type: row.type as any,
    estimatedTime: Number(row.estimated_time),
    realTime: row.real_time != null ? Number(row.real_time) : undefined,
    deadline: row.deadline,
    status: row.status,
    priority: row.priority,
    comments: row.comments,
    createdAt: row.created_at,
    platforms: (row as any).platform ?? undefined,
    flowId: (row as any).flow_id ?? undefined,
    motivoAtraso: (row as any).motivo_atraso ?? '',
    subtasks: subtasks.map(mapDbSubtask),
    chatNotes: chatNotes.map(mapDbChatNote),
    platformId: (row as any).platform_id ?? undefined,
    etapa: (row as any).etapa ?? '',
    bloqueiaPassagem: (row as any).bloqueia_passagem ?? false,
    dependeCliente: (row as any).depende_cliente ?? false,
    aguardandoCliente: (row as any).aguardando_cliente ?? false,
    origemTarefa: (row as any).origem_tarefa ?? 'manual',
    linkEntrega: (row as any).link_entrega ?? '',
    printEntrega: (row as any).print_entrega ?? '',
    observacaoEntrega: (row as any).observacao_entrega ?? '',
    notaEntrega: (row as any).nota_entrega != null ? Number((row as any).nota_entrega) : undefined,
    approvalStatus: (row as any).approval_status ?? 'pending',
    approvedBy: (row as any).approved_by ?? '',
    approvedAt: (row as any).approved_at ?? undefined,
    rejectionReason: (row as any).rejection_reason ?? '',
    rejectionCount: (row as any).rejection_count ?? 0,
    dependsOn,
    startedAt: (row as any).started_at ?? undefined,
    completedAt: (row as any).completed_at ?? undefined,
    tempoRealMinutos: (row as any).tempo_real_minutos != null ? Number((row as any).tempo_real_minutos) : undefined,
  };
}

export function mapDbSubtask(row: DbSubtask): SubTask {
  return {
    id: row.id,
    label: row.label,
    done: row.done,
    checkedBy: row.checked_by ?? undefined,
    checkedAt: row.checked_at ?? undefined,
  };
}

export function mapDbSquad(row: DbSquad): Squad {
  return { id: row.id, name: row.name, leader: row.leader, members: row.members };
}

export function mapDbTeamMember(row: DbTeamMember): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role as TeamRole,
    squadId: row.squad_id ?? undefined,
    avatar: row.avatar ?? undefined,
    completedTasks: row.completed_tasks,
    avgTime: Number(row.avg_time),
    lateTasks: row.late_tasks,
    currentLoad: row.current_load,
    onTimePct: Number(row.on_time_pct),
  };
}

export function mapDbFlow(row: DbFlow): Flow {
  return { id: row.id, name: row.name, steps: row.steps, createdAt: row.created_at };
}

export interface AppUserProfile {
  id: string;
  name: string;
  login: string;
  role: TeamRole;
  accessLevel: AccessLevel;
  squadIds: string[];
  authUserId: string | null;
  hireDate: string | null;
  birthday: string | null;
}

export function mapDbAppUser(row: DbAppUser): AppUserProfile {
  return {
    id: row.id,
    name: row.name,
    login: row.login,
    role: row.role as TeamRole,
    accessLevel: row.access_level as AccessLevel,
    squadIds: row.squad_ids,
    authUserId: row.auth_user_id,
    hireDate: (row as any).hire_date ?? null,
    birthday: (row as any).birthday ?? null,
  };
}
