import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PhaseDemandTemplate {
  id: string;
  phase: string;
  title: string;
  demandOwner: string;
  flowId: string | null;
  sortOrder: number;
  createdAt: string;
}

function mapRow(row: any): PhaseDemandTemplate {
  return {
    id: row.id,
    phase: row.phase,
    title: row.title,
    demandOwner: row.demand_owner,
    flowId: row.flow_id ?? null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function usePhaseDemandsQuery() {
  return useQuery({
    queryKey: ['phase_demand_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phase_demand_templates' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useAddPhaseDemand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { phase: string; title: string; demandOwner: string; flowId?: string | null; sortOrder?: number }) => {
      const { error } = await supabase.from('phase_demand_templates' as any).insert({
        phase: input.phase,
        title: input.title,
        demand_owner: input.demandOwner,
        flow_id: input.flowId ?? null,
        sort_order: input.sortOrder ?? 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phase_demand_templates'] }),
  });
}

export function useUpdatePhaseDemand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ title: string; demandOwner: string; flowId: string | null; sortOrder: number }> }) => {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.demandOwner !== undefined) dbUpdates.demand_owner = updates.demandOwner;
      if (updates.flowId !== undefined) dbUpdates.flow_id = updates.flowId;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
      const { error } = await supabase.from('phase_demand_templates' as any).update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phase_demand_templates'] }),
  });
}

export function useDeletePhaseDemand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('phase_demand_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phase_demand_templates'] }),
  });
}
