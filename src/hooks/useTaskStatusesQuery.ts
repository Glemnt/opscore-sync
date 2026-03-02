import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { taskStatusConfig } from '@/lib/config';

export interface TaskStatusRow {
  id: string;
  key: string;
  label: string;
  class_name: string;
  sort_order: number;
}

export function useTaskStatusesQuery() {
  return useQuery({
    queryKey: ['task_statuses'],
    queryFn: async (): Promise<TaskStatusRow[]> => {
      const { data, error } = await supabase
        .from('task_statuses' as any)
        .select('id, key, label, class_name, sort_order')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as TaskStatusRow[];
    },
  });
}

export function useTaskStatusesMap(): Record<string, { label: string; className: string }> {
  const { data: statuses = [] } = useTaskStatusesQuery();
  const map: Record<string, { label: string; className: string }> = { ...taskStatusConfig };
  for (const s of statuses) {
    map[s.key] = { label: s.label, className: s.class_name };
  }
  return map;
}

export function useAddTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string; class_name: string }) => {
      // Get max sort_order
      const { data: existing } = await supabase
        .from('task_statuses' as any)
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);
      const maxOrder = (existing as any)?.[0]?.sort_order ?? -1;
      const { error } = await supabase
        .from('task_statuses' as any)
        .insert({ key: input.key, label: input.label, class_name: input.class_name, sort_order: maxOrder + 1 } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_statuses'] }),
  });
}

export function useDeleteTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase
        .from('task_statuses' as any)
        .delete()
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_statuses'] }),
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string; class_name?: string }) => {
      const updates: Record<string, string> = { label: input.label };
      if (input.class_name) updates.class_name = input.class_name;
      const { error } = await supabase
        .from('task_statuses' as any)
        .update(updates as any)
        .eq('key', input.key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_statuses'] }),
  });
}

export function useReorderTaskStatuses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { key: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase
          .from('task_statuses' as any)
          .update({ sort_order: item.sort_order } as any)
          .eq('key', item.key);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_statuses'] }),
  });
}
