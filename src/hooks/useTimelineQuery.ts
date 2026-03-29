import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TimelineEvent {
  id: string;
  clientId: string;
  platformId: string | null;
  taskId: string | null;
  eventType: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  triggeredBy: string;
  createdAt: string;
}

function mapRow(row: any): TimelineEvent {
  return {
    id: row.id,
    clientId: row.client_id,
    platformId: row.platform_id,
    taskId: row.task_id,
    eventType: row.event_type,
    description: row.description,
    oldValue: row.old_value,
    newValue: row.new_value,
    triggeredBy: row.triggered_by,
    createdAt: row.created_at,
  };
}

export function useTimelineEventsQuery(clientId?: string) {
  return useQuery({
    queryKey: ['timeline_events', clientId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('timeline_events' as any).select('*').order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!clientId,
  });
}

export function useTimelineByPlatform(platformId?: string) {
  return useQuery({
    queryKey: ['timeline_events_platform', platformId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_events' as any)
        .select('*')
        .eq('platform_id', platformId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!platformId,
  });
}

export function useAddTimelineEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      clientId: string;
      platformId?: string | null;
      taskId?: string | null;
      eventType: string;
      description: string;
      oldValue?: string | null;
      newValue?: string | null;
      triggeredBy: string;
    }) => {
      const { error } = await supabase.from('timeline_events' as any).insert({
        client_id: event.clientId,
        platform_id: event.platformId ?? null,
        task_id: event.taskId ?? null,
        event_type: event.eventType,
        description: event.description,
        old_value: event.oldValue ?? null,
        new_value: event.newValue ?? null,
        triggered_by: event.triggeredBy,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeline_events'] });
      qc.invalidateQueries({ queryKey: ['timeline_events_platform'] });
    },
  });
}

// Fire-and-forget helper for logging timeline events without blocking the UI
export async function logTimelineEvent(params: {
  clientId: string;
  platformId?: string | null;
  taskId?: string | null;
  eventType: string;
  description: string;
  oldValue?: string | null;
  newValue?: string | null;
  triggeredBy: string;
}) {
  try {
    await supabase.from('timeline_events' as any).insert({
      client_id: params.clientId,
      platform_id: params.platformId ?? null,
      task_id: params.taskId ?? null,
      event_type: params.eventType,
      description: params.description,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      triggered_by: params.triggeredBy,
    } as any);
  } catch (e) {
    console.error('Timeline log error:', e);
  }
}

// Event type configuration for display
export const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  client_created: { label: 'Cliente criado', icon: '🆕', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  contract_started: { label: 'Contrato iniciado', icon: '📝', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  platform_added: { label: 'Plataforma adicionada', icon: '➕', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  platform_removed: { label: 'Plataforma removida', icon: '➖', color: 'text-red-600 bg-red-50 border-red-200' },
  client_phase_changed: { label: 'Fase do cliente alterada', icon: '🔄', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  platform_phase_changed: { label: 'Fase da plataforma alterada', icon: '🔄', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  platform_status_changed: { label: 'Status da plataforma alterado', icon: '📊', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  responsible_changed: { label: 'Responsável alterado', icon: '👤', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  task_created: { label: 'Tarefa criada', icon: '📋', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  task_completed: { label: 'Tarefa concluída', icon: '✅', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  task_rejected: { label: 'Tarefa reprovada', icon: '❌', color: 'text-red-600 bg-red-50 border-red-200' },
  task_overdue: { label: 'Tarefa atrasada', icon: '⏰', color: 'text-red-600 bg-red-50 border-red-200' },
  client_contact: { label: 'Contato com cliente', icon: '💬', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  client_no_response: { label: 'Sem resposta do cliente', icon: '🔇', color: 'text-red-600 bg-red-50 border-red-200' },
  block_registered: { label: 'Bloqueio registrado', icon: '🚫', color: 'text-red-600 bg-red-50 border-red-200' },
  platform_to_performance: { label: 'Passagem para performance', icon: '🚀', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  platform_to_scale: { label: 'Passagem para escala', icon: '📈', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  client_paused: { label: 'Cliente pausado', icon: '⏸️', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  client_churn: { label: 'Cliente cancelado', icon: '🔴', color: 'text-red-600 bg-red-50 border-red-200' },
  health_score_changed: { label: 'Saúde alterada', icon: '💊', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  nps_registered: { label: 'NPS registrado', icon: '⭐', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  action_plan_created: { label: 'Plano de ação criado', icon: '📑', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  journey_meeting: { label: 'Reunião realizada', icon: '🤝', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  general_change: { label: 'Alteração geral', icon: '✏️', color: 'text-muted-foreground bg-muted border-border' },
};
