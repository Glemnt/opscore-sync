import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActionPlan {
  id: string;
  clientId: string;
  clientName?: string;
  platformId: string | null;
  identifiedAt: string;
  daysDelayed: number;
  issueDescription: string;
  crisisType: string;
  rootCause: string;
  responsibleForDelay: string;
  actionPlanText: string;
  newDeadline: string | null;
  resolutionStatus: string;
  managerAware: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const CRISIS_TYPES = [
  { value: 'atraso_tarefa', label: 'Atraso de tarefa' },
  { value: 'bloqueio_externo', label: 'Bloqueio externo' },
  { value: 'erro_interno', label: 'Erro interno' },
  { value: 'risco_churn', label: 'Risco de churn' },
  { value: 'crise_comunicacao', label: 'Crise de comunicação' },
  { value: 'problema_tecnico', label: 'Problema técnico' },
  { value: 'problema_financeiro', label: 'Problema financeiro' },
  { value: 'outro', label: 'Outro' },
] as const;

export const RESOLUTION_STATUSES = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'escalado_diretoria', label: 'Escalado diretoria' },
  { value: 'resolvido', label: 'Resolvido' },
] as const;

function mapRow(row: any, clientName?: string): ActionPlan {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName,
    platformId: row.platform_id,
    identifiedAt: row.identified_at,
    daysDelayed: row.days_delayed,
    issueDescription: row.issue_description,
    crisisType: row.crisis_type,
    rootCause: row.root_cause,
    responsibleForDelay: row.responsible_for_delay,
    actionPlanText: row.action_plan_text,
    newDeadline: row.new_deadline,
    resolutionStatus: row.resolution_status,
    managerAware: row.manager_aware,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useActionPlansQuery() {
  return useQuery({
    queryKey: ['action_plans'],
    queryFn: async () => {
      const [plansRes, clientsRes] = await Promise.all([
        supabase.from('action_plans').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name'),
      ]);
      if (plansRes.error) throw plansRes.error;
      const clientMap = new Map((clientsRes.data ?? []).map((c: any) => [c.id, c.name]));
      return (plansRes.data ?? []).map((r: any) => mapRow(r, clientMap.get(r.client_id) ?? ''));
    },
  });
}

export function useAddActionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Omit<ActionPlan, 'id' | 'createdAt' | 'updatedAt' | 'clientName'>) => {
      const { error } = await supabase.from('action_plans').insert({
        client_id: plan.clientId,
        platform_id: plan.platformId,
        identified_at: plan.identifiedAt,
        days_delayed: plan.daysDelayed,
        issue_description: plan.issueDescription,
        crisis_type: plan.crisisType,
        root_cause: plan.rootCause,
        responsible_for_delay: plan.responsibleForDelay,
        action_plan_text: plan.actionPlanText,
        new_deadline: plan.newDeadline,
        resolution_status: plan.resolutionStatus,
        manager_aware: plan.managerAware,
        created_by: plan.createdBy,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action_plans'] }),
  });
}

export function useUpdateActionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ActionPlan> }) => {
      const dbUpdates: Record<string, any> = {};
      const keyMap: Record<string, string> = {
        clientId: 'client_id', platformId: 'platform_id', identifiedAt: 'identified_at',
        daysDelayed: 'days_delayed', issueDescription: 'issue_description', crisisType: 'crisis_type',
        rootCause: 'root_cause', responsibleForDelay: 'responsible_for_delay',
        actionPlanText: 'action_plan_text', newDeadline: 'new_deadline',
        resolutionStatus: 'resolution_status', managerAware: 'manager_aware', createdBy: 'created_by',
      };
      for (const [k, v] of Object.entries(updates)) {
        if (k === 'id' || k === 'clientName' || k === 'createdAt' || k === 'updatedAt') continue;
        dbUpdates[keyMap[k] ?? k] = v;
      }
      const { error } = await supabase.from('action_plans').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action_plans'] }),
  });
}

export function useDeleteActionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('action_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['action_plans'] }),
  });
}
