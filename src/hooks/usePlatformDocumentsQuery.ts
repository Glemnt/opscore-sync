import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformDocument {
  id: string;
  clientPlatformId: string;
  fileName: string;
  filePath: string;
  uploadedBy: string;
  createdAt: string;
}

export function usePlatformDocumentsQuery(clientPlatformId: string | undefined) {
  return useQuery({
    queryKey: ['platform_documents', clientPlatformId],
    enabled: !!clientPlatformId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_documents')
        .select('*')
        .eq('client_platform_id', clientPlatformId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r): PlatformDocument => ({
        id: r.id,
        clientPlatformId: r.client_platform_id,
        fileName: r.file_name,
        filePath: r.file_path,
        uploadedBy: r.uploaded_by,
        createdAt: r.created_at,
      }));
    },
  });
}

export function useUploadPlatformDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { clientPlatformId: string; file: File; uploadedBy: string }) => {
      const filePath = `${input.clientPlatformId}/${Date.now()}_${input.file.name}`;
      const { error: storageError } = await supabase.storage
        .from('platform-documents')
        .upload(filePath, input.file);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('platform_documents').insert({
        client_platform_id: input.clientPlatformId,
        file_name: input.file.name,
        file_path: filePath,
        uploaded_by: input.uploadedBy,
      });
      if (dbError) throw dbError;
      return input.clientPlatformId;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['platform_documents', v.clientPlatformId] }),
  });
}

export function useDeletePlatformDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, clientPlatformId }: { id: string; filePath: string; clientPlatformId: string }) => {
      await supabase.storage.from('platform-documents').remove([filePath]);
      const { error } = await supabase.from('platform_documents').delete().eq('id', id);
      if (error) throw error;
      return clientPlatformId;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['platform_documents', v.clientPlatformId] }),
  });
}

export function getPlatformDocumentUrl(filePath: string): string {
  const { data } = supabase.storage.from('platform-documents').getPublicUrl(filePath);
  return data.publicUrl;
}
