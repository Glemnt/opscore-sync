import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduledMilestone {
  id: string;
  clientId: string;
  platformId: string | null;
  milestoneType: string;
  scheduledDate: string;
  actualDate: string | null;
  status: string;
  responsible: string;
  notes: string;
  title: string;
  createdAt: string;
}

function mapRow(row: any): ScheduledMilestone {
  return {
    id: row.id,
    clientId: row.client_id,
    platformId: row.platform_id,
    milestoneType: row.milestone_type,
    scheduledDate: row.scheduled_date,
    actualDate: row.actual_date,
    status: row.status,
    responsible: row.responsible,
    notes: row.notes,
    title: row.title,
    createdAt: row.created_at,
  };
}

export function useMilestonesQuery(filters?: { responsible?: string; status?: string }) {
  return useQuery({
    queryKey: ['scheduled_milestones', filters],
    queryFn: async () => {
      let q = supabase.from('scheduled_milestones').select('*').order('scheduled_date', { ascending: true });
      if (filters?.responsible) q = q.eq('responsible', filters.responsible);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useAddMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: { clientId: string; platformId?: string; milestoneType: string; scheduledDate: string; responsible: string; title: string }) => {
      const { error } = await supabase.from('scheduled_milestones').insert({
        client_id: m.clientId,
        platform_id: m.platformId ?? null,
        milestone_type: m.milestoneType,
        scheduled_date: m.scheduledDate,
        responsible: m.responsible,
        title: m.title,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled_milestones'] }),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const mapped: Record<string, any> = {};
      if (updates.scheduledDate !== undefined) mapped.scheduled_date = updates.scheduledDate;
      if (updates.actualDate !== undefined) mapped.actual_date = updates.actualDate;
      if (updates.status !== undefined) mapped.status = updates.status;
      if (updates.notes !== undefined) mapped.notes = updates.notes;
      if (updates.responsible !== undefined) mapped.responsible = updates.responsible;
      const { error } = await supabase.from('scheduled_milestones').update(mapped).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled_milestones'] }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scheduled_milestones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled_milestones'] }),
  });
}

// Helper: add business days
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

const MILESTONE_TEMPLATES = [
  { type: 'reuniao_onboard', title: 'Reunião de Onboard', days: 1 },
  { type: 'reuniao_implementacao', title: 'Reunião de Implementação', days: 3 },
  { type: 'reuniao_entrega', title: 'Reunião de Entrega', days: 14 },
  { type: 'checkpoint_30', title: 'Checkpoint 30 dias', days: 30 },
  { type: 'checkpoint_60', title: 'Checkpoint 60 dias', days: 60 },
  { type: 'checkpoint_90', title: 'Checkpoint 90 dias', days: 90 },
];

export async function generateMilestonesForClient(clientId: string, startDate: string, responsible: string) {
  const start = new Date(startDate);
  const rows = MILESTONE_TEMPLATES.map((t) => ({
    client_id: clientId,
    milestone_type: t.type,
    title: t.title,
    scheduled_date: fmt(addBusinessDays(start, t.days)),
    responsible,
    status: 'pendente',
  }));
  const { error } = await supabase.from('scheduled_milestones').insert(rows);
  if (error) console.error('Error generating milestones:', error);
}

export const MILESTONE_TYPE_LABELS: Record<string, string> = {
  reuniao_onboard: 'Reunião Onboard',
  reuniao_implementacao: 'Reunião Implementação',
  reuniao_entrega: 'Reunião Entrega',
  checkpoint_30: 'Checkpoint 30d',
  checkpoint_60: 'Checkpoint 60d',
  checkpoint_90: 'Checkpoint 90d',
};

export const MILESTONE_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  realizado: 'Realizado',
  reagendado: 'Reagendado',
  cancelado: 'Cancelado',
};
