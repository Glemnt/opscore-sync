import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformChatNote {
  id: string;
  clientPlatformId: string;
  author: string;
  message: string;
  createdAt: string;
}

export function usePlatformChatNotesQuery(clientPlatformId: string | undefined) {
  return useQuery({
    queryKey: ['platform_chat_notes', clientPlatformId],
    enabled: !!clientPlatformId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_chat_notes')
        .select('*')
        .eq('client_platform_id', clientPlatformId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r): PlatformChatNote => ({
        id: r.id,
        clientPlatformId: r.client_platform_id,
        author: r.author,
        message: r.message,
        createdAt: r.created_at,
      }));
    },
  });
}

export function useAddPlatformChatNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { clientPlatformId: string; message: string; author: string }) => {
      const { error } = await supabase.from('platform_chat_notes').insert({
        client_platform_id: input.clientPlatformId,
        message: input.message,
        author: input.author,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['platform_chat_notes', v.clientPlatformId] }),
  });
}

export function useDeletePlatformChatNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientPlatformId }: { id: string; clientPlatformId: string }) => {
      const { error } = await supabase.from('platform_chat_notes').delete().eq('id', id);
      if (error) throw error;
      return clientPlatformId;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['platform_chat_notes', v.clientPlatformId] }),
  });
}
