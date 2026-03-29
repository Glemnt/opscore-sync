import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingChecklistItem {
  id: string;
  clientId: string;
  taskKey: string;
  status: 'feito' | 'pendente' | 'atrasado' | 'nao_aplica';
  completedBy: string;
  completedAt: string | null;
  createdAt: string;
}

function mapRow(row: any): OnboardingChecklistItem {
  return {
    id: row.id,
    clientId: row.client_id,
    taskKey: row.task_key,
    status: row.status,
    completedBy: row.completed_by ?? '',
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export function useOnboardingChecklistQuery() {
  return useQuery({
    queryKey: ['onboarding-checklist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_checklist_items' as any)
        .select('*');
      if (error) throw error;
      return (data as any[]).map(mapRow);
    },
  });
}

const STATUS_CYCLE: Record<string, string> = {
  pendente: 'feito',
  feito: 'nao_aplica',
  nao_aplica: 'pendente',
  atrasado: 'feito',
};

export function useUpsertChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { clientId: string; taskKey: string; currentStatus: string; userName: string }) => {
      const nextStatus = STATUS_CYCLE[params.currentStatus] || 'feito';
      const now = nextStatus === 'feito' ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('onboarding_checklist_items' as any)
        .upsert(
          {
            client_id: params.clientId,
            task_key: params.taskKey,
            status: nextStatus,
            completed_by: nextStatus === 'feito' ? params.userName : '',
            completed_at: now,
          } as any,
          { onConflict: 'client_id,task_key' }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding-checklist'] }),
  });
}
