import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskTypeRow {
  id: string;
  key: string;
  label: string;
  color: string;
}

export function useTaskTypesQuery() {
  return useQuery({
    queryKey: ['task_types'],
    queryFn: async (): Promise<TaskTypeRow[]> => {
      const { data, error } = await supabase
        .from('task_types' as any)
        .select('id, key, label, color')
        .order('label');
      if (error) throw error;
      return (data ?? []) as unknown as TaskTypeRow[];
    },
  });
}

export function useTaskTypesMap() {
  const { data: types = [] } = useTaskTypesQuery();
  const map: Record<string, { label: string; color: string }> = {};
  for (const t of types) {
    map[t.key] = { label: t.label, color: t.color };
  }
  return map;
}

export function useAddTaskType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string; color: string }) => {
      const { error } = await supabase
        .from('task_types' as any)
        .insert({ key: input.key, label: input.label, color: input.color } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_types'] }),
  });
}

export function useDeleteTaskType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_types' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_types'] }),
  });
}
