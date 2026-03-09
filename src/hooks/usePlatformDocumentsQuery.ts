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

export function usePlatformDocumentsQuery(platformId: string | undefined) {
  return useQuery({
    queryKey: ['platform_documents', platformId],
    enabled: !!platformId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_documents' as any)
        .select('*')
        .eq('client_platform_id', platformId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data as any[]) ?? []).map((r: any): PlatformDocument => ({
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
      const path = `${input.clientPlatformId}/${Date.now()}_${input.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('platform-documents')
        .upload(path, input.file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from('platform_documents' as any).insert({
        client_platform_id: input.clientPlatformId,
        file_name: input.file.name,
        file_path: path,
        uploaded_by: input.uploadedBy,
      } as any);
      if (error) throw error;
      return input.clientPlatformId;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['platform_documents', vars.clientPlatformId] }),
  });
}

export function useDeletePlatformDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, clientPlatformId }: { id: string; filePath: string; clientPlatformId: string }) => {
      await supabase.storage.from('platform-documents').remove([filePath]);
      const { error } = await supabase.from('platform_documents' as any).delete().eq('id', id);
      if (error) throw error;
      return clientPlatformId;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['platform_documents', vars.clientPlatformId] }),
  });
}

export function getPlatformDocumentUrl(filePath: string) {
  const { data } = supabase.storage.from('platform-documents').getPublicUrl(filePath);
  return data.publicUrl;
}
