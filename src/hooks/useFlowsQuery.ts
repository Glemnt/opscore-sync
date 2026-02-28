import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDbFlow, type DbFlow, type DbCustomTemplate } from '@/types/database';
import type { Flow } from '@/types';

export function useFlowsQuery() {
  return useQuery({
    queryKey: ['flows'],
    queryFn: async () => {
      const { data, error } = await supabase.from('flows').select('*');
      if (error) throw error;
      return (data as DbFlow[]).map(mapDbFlow);
    },
  });
}

export function useAddFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (flow: Flow) => {
      const { error } = await supabase.from('flows').insert({
        id: flow.id, name: flow.name, steps: flow.steps,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flows'] }),
  });
}

export function useUpdateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Flow, 'id'>> }) => {
      const { error } = await supabase.from('flows').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flows'] }),
  });
}

export function useDeleteFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('flows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flows'] }),
  });
}

// Custom templates
export interface CustomTemplate {
  id: string;
  name: string;
  subtasks: string[];
}

export function useCustomTemplatesQuery() {
  return useQuery({
    queryKey: ['custom_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_templates').select('*');
      if (error) throw error;
      return (data as DbCustomTemplate[]).map((t): CustomTemplate => ({
        id: t.id, name: t.name, subtasks: t.subtasks,
      }));
    },
  });
}

export function useAddTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: CustomTemplate) => {
      const { error } = await supabase.from('custom_templates').insert({
        id: t.id, name: t.name, subtasks: t.subtasks,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<CustomTemplate, 'id'>> }) => {
      const { error } = await supabase.from('custom_templates').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_templates'] }),
  });
}

export function useRemoveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_templates'] }),
  });
}
