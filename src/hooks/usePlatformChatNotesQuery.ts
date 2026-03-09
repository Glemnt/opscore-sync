import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformChatNote {
  id: string;
  clientPlatformId: string;
  message: string;
  author: string;
  createdAt: string;
}

export function usePlatformChatNotesQuery(platformId: string | undefined) {
  return useQuery({
    queryKey: ['platform_chat_notes', platformId],
    enabled: !!platformId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_chat_notes' as any)
        .select('*')
        .eq('client_platform_id', platformId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ((data as any[]) ?? []).map((r: any): PlatformChatNote => ({
        id: r.id,
        clientPlatformId: r.client_platform_id,
        message: r.message,
        author: r.author,
        createdAt: r.created_at,
      }));
    },
  });
}

export function useAddPlatformChatNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { clientPlatformId: string; message: string; author: string }) => {
      const { error } = await supabase.from('platform_chat_notes' as any).insert({
        client_platform_id: input.clientPlatformId,
        message: input.message,
        author: input.author,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['platform_chat_notes', vars.clientPlatformId] }),
  });
}

export function useDeletePlatformChatNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientPlatformId }: { id: string; clientPlatformId: string }) => {
      const { error } = await supabase.from('platform_chat_notes' as any).delete().eq('id', id);
      if (error) throw error;
      return clientPlatformId;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['platform_chat_notes', vars.clientPlatformId] }),
  });
}
