import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPlatformChecklistItem {
  id: string;
  clientPlatformId: string;
  catalogItemId: string;
  label: string;
  etapa: string;
  bloqueiaPassagem: boolean;
  done: boolean;
  checkedBy: string;
  checkedAt: string | null;
  sortOrder: number;
  createdAt: string;
}

function mapRow(row: any): ClientPlatformChecklistItem {
  return {
    id: row.id,
    clientPlatformId: row.client_platform_id,
    catalogItemId: row.catalog_item_id,
    label: row.label,
    etapa: row.etapa ?? '',
    bloqueiaPassagem: row.bloqueia_passagem ?? false,
    done: row.done ?? false,
    checkedBy: row.checked_by ?? '',
    checkedAt: row.checked_at ?? null,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

export function useClientPlatformChecklistQuery(clientPlatformId: string) {
  return useQuery({
    queryKey: ['client_platform_checklist', clientPlatformId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_platform_checklist' as any)
        .select('*')
        .eq('client_platform_id', clientPlatformId)
        .order('sort_order');
      if (error) throw error;
      return ((data as any[]) ?? []).map(mapRow);
    },
    enabled: !!clientPlatformId,
  });
}

export function useSeedChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientPlatformId, items }: {
      clientPlatformId: string;
      items: { id: string; label: string; etapa: string; bloqueia_passagem: boolean }[];
    }) => {
      const rows = items.map((item, i) => ({
        client_platform_id: clientPlatformId,
        catalog_item_id: item.id,
        label: item.label,
        etapa: item.etapa,
        bloqueia_passagem: item.bloqueia_passagem,
        sort_order: i,
      }));
      const { error } = await supabase
        .from('client_platform_checklist' as any)
        .insert(rows as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['client_platform_checklist', vars.clientPlatformId] }),
  });
}

export function useToggleChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done, checkedBy, clientPlatformId }: { id: string; done: boolean; checkedBy: string; clientPlatformId: string }) => {
      const { error } = await supabase
        .from('client_platform_checklist' as any)
        .update({
          done,
          checked_by: done ? checkedBy : '',
          checked_at: done ? new Date().toISOString() : null,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['client_platform_checklist', vars.clientPlatformId] }),
  });
}
