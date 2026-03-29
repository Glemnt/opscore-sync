import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DelayReason {
  id: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export function useDelayReasonsQuery() {
  return useQuery({
    queryKey: ['delay_reasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delay_reasons')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        label: r.label,
        isActive: r.is_active,
        sortOrder: r.sort_order,
      })) as DelayReason[];
    },
  });
}

export function useActiveDelayReasons() {
  const { data = [] } = useDelayReasonsQuery();
  return data.filter(r => r.isActive);
}

export function useAddDelayReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ label, sortOrder }: { label: string; sortOrder: number }) => {
      const { error } = await supabase.from('delay_reasons').insert({ label, sort_order: sortOrder });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delay_reasons'] }),
  });
}

export function useUpdateDelayReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ label: string; is_active: boolean; sort_order: number }> }) => {
      const { error } = await supabase.from('delay_reasons').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delay_reasons'] }),
  });
}

export function useDeleteDelayReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('delay_reasons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delay_reasons'] }),
  });
}
