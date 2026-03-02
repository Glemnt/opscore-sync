import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export function usePlatformsQuery() {
  return useQuery<PlatformRow[]>({
    queryKey: ['platforms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platforms' as any)
        .select('*')
        .order('name');
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useAddPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      const { error } = await supabase
        .from('platforms' as any)
        .insert({ name, slug } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platforms'] }),
  });
}

export function useDeletePlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platforms' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platforms'] }),
  });
}
