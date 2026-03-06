import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { clientStatusConfig } from '@/lib/config';

export interface ClientStatusRow {
  id: string;
  key: string;
  label: string;
  class_name: string;
  sort_order: number;
  board: string;
}

export function useClientStatusesQuery(board: string = 'clients') {
  return useQuery({
    queryKey: ['client_statuses', board],
    queryFn: async (): Promise<ClientStatusRow[]> => {
      const { data, error } = await supabase
        .from('client_statuses' as any)
        .select('id, key, label, class_name, sort_order, board')
        .eq('board', board)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as ClientStatusRow[];
    },
  });
}

export function useClientStatusesMap(board: string = 'clients'): Record<string, { label: string; className: string }> {
  const { data: statuses = [] } = useClientStatusesQuery(board);
  const map: Record<string, { label: string; className: string }> = { ...clientStatusConfig };
  for (const s of statuses) {
    map[s.key] = { label: s.label, className: s.class_name };
  }
  return map;
}

export function useAddClientStatus(board: string = 'clients') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string; class_name: string }) => {
      const { data: existing } = await supabase
        .from('client_statuses' as any)
        .select('sort_order')
        .eq('board', board)
        .order('sort_order', { ascending: false })
        .limit(1);
      const maxOrder = (existing as any)?.[0]?.sort_order ?? -1;
      const { error } = await supabase
        .from('client_statuses' as any)
        .insert({ key: input.key, label: input.label, class_name: input.class_name, sort_order: maxOrder + 1, board } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_statuses', board] }),
  });
}

export function useDeleteClientStatus(board: string = 'clients') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase
        .from('client_statuses' as any)
        .delete()
        .eq('key', key)
        .eq('board', board);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_statuses', board] }),
  });
}

export function useUpdateClientStatus(board: string = 'clients') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string; class_name?: string }) => {
      const updates: Record<string, string> = { label: input.label };
      if (input.class_name) updates.class_name = input.class_name;
      const { error } = await supabase
        .from('client_statuses' as any)
        .update(updates as any)
        .eq('key', input.key)
        .eq('board', board);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_statuses', board] }),
  });
}

export function useReorderClientStatuses(board: string = 'clients') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { key: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase
          .from('client_statuses' as any)
          .update({ sort_order: item.sort_order } as any)
          .eq('key', item.key)
          .eq('board', board);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_statuses', board] }),
  });
}
