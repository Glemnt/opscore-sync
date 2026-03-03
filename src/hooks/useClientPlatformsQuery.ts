import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPlatform {
  id: string;
  clientId: string;
  platformSlug: string;
  phase: string;
  responsible: string;
  squadId: string | null;
  startDate: string | null;
  deadline: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: any): ClientPlatform {
  return {
    id: row.id,
    clientId: row.client_id,
    platformSlug: row.platform_slug,
    phase: row.phase,
    responsible: row.responsible,
    squadId: row.squad_id,
    startDate: row.start_date,
    deadline: row.deadline,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useClientPlatformsQuery() {
  return useQuery({
    queryKey: ['client_platforms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_platforms').select('*');
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useAddClientPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { clientId: string; platformSlug: string; phase?: string; responsible?: string; squadId?: string | null; startDate?: string; deadline?: string | null }) => {
      const { error } = await supabase.from('client_platforms').insert({
        client_id: input.clientId,
        platform_slug: input.platformSlug,
        phase: input.phase ?? 'onboarding',
        responsible: input.responsible ?? '',
        squad_id: input.squadId ?? null,
        start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
        deadline: input.deadline ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
  });
}

export function useUpdateClientPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const dbUpdates: Record<string, any> = {};
      const keyMap: Record<string, string> = {
        platformSlug: 'platform_slug',
        squadId: 'squad_id',
        startDate: 'start_date',
      };
      for (const [k, v] of Object.entries(updates)) {
        dbUpdates[keyMap[k] ?? k] = v;
      }
      const { error } = await supabase.from('client_platforms').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
  });
}

export function useDeleteClientPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_platforms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
  });
}
