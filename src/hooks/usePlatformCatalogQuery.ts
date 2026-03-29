import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChecklistItem {
  id: string;
  label: string;
  etapa: string;
  bloqueia_passagem: boolean;
}

export interface PlatformCatalogRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  prazo_onboarding: number;
  prazo_implementacao: number;
  checklist_obrigatorio: ChecklistItem[];
  tipos_demanda_permitidos: string[];
  criterios_passagem: string[];
  created_at: string;
}

export function usePlatformCatalogQuery() {
  return useQuery<PlatformCatalogRow[]>({
    queryKey: ['platform_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_catalog' as any)
        .select('*')
        .order('name');
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useAddPlatformCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<PlatformCatalogRow, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('platform_catalog' as any)
        .insert(row as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform_catalog'] }),
  });
}

export function useUpdatePlatformCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<PlatformCatalogRow> & { id: string }) => {
      const { error } = await supabase
        .from('platform_catalog' as any)
        .update(rest as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform_catalog'] }),
  });
}

export function useDeletePlatformCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_catalog' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform_catalog'] }),
  });
}
