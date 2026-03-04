import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformPhaseStatusRow {
  id: string;
  key: string;
  label: string;
  class_name: string;
  sort_order: number;
}

export function usePlatformPhaseStatusesQuery() {
  return useQuery({
    queryKey: ['platform_phase_statuses'],
    queryFn: async (): Promise<PlatformPhaseStatusRow[]> => {
      const { data, error } = await supabase
        .from('platform_phase_statuses' as any)
        .select('id, key, label, class_name, sort_order')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as PlatformPhaseStatusRow[];
    },
  });
}

export function useAddPlatformPhaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string; class_name: string }) => {
      const { data: existing } = await supabase
        .from('platform_phase_statuses' as any)
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);
      const maxOrder = (existing as any)?.[0]?.sort_order ?? -1;
      const { error } = await supabase
        .from('platform_phase_statuses' as any)
        .insert({ key: input.key, label: input.label, class_name: input.class_name, sort_order: maxOrder + 1 } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform_phase_statuses'] }),
  });
}

export function useDeletePlatformPhaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase
        .from('platform_phase_statuses' as any)
        .delete()
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform_phase_statuses'] }),
  });
}

export function useUpdatePlatformPhaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string; class_name?: string }) => {
      const updates: Record<string, string> = { label: input.label };
      if (input.class_name) updates.class_name = input.class_name;
      const { error } = await supabase
        .from('platform_phase_statuses' as any)
        .update(updates as any)
        .eq('key', input.key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform_phase_statuses'] }),
  });
}

export function useReorderPlatformPhaseStatuses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { key: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase
          .from('platform_phase_statuses' as any)
          .update({ sort_order: item.sort_order } as any)
          .eq('key', item.key);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform_phase_statuses'] }),
  });
}
