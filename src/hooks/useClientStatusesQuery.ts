import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { clientStatusConfig } from '@/lib/config';

export interface ClientStatusRow {
  id: string;
  key: string;
  label: string;
  class_name: string;
}

export function useClientStatusesQuery() {
  return useQuery({
    queryKey: ['client_statuses'],
    queryFn: async (): Promise<ClientStatusRow[]> => {
      const { data, error } = await supabase
        .from('client_statuses' as any)
        .select('id, key, label, class_name')
        .order('label');
      if (error) throw error;
      return (data ?? []) as unknown as ClientStatusRow[];
    },
  });
}

export function useClientStatusesMap(): Record<string, { label: string; className: string }> {
  const { data: statuses = [] } = useClientStatusesQuery();
  // Start with static fallback
  const map: Record<string, { label: string; className: string }> = { ...clientStatusConfig };
  // Override / add from DB
  for (const s of statuses) {
    map[s.key] = { label: s.label, className: s.class_name };
  }
  return map;
}

export function useAddClientStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string; class_name: string }) => {
      const { error } = await supabase
        .from('client_statuses' as any)
        .insert({ key: input.key, label: input.label, class_name: input.class_name } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_statuses'] }),
  });
}

export function useDeleteClientStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase
        .from('client_statuses' as any)
        .delete()
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_statuses'] }),
  });
}
