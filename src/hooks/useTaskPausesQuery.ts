import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TaskPause } from '@/types';

function mapRow(row: any): TaskPause {
  return {
    id: row.id,
    taskId: row.task_id,
    pauseStart: row.pause_start,
    pauseEnd: row.pause_end,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export function useTaskPausesQuery() {
  return useQuery({
    queryKey: ['task_pauses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('task_pauses' as any).select('*');
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useStartPause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
      const { error } = await supabase.from('task_pauses' as any).insert({
        task_id: taskId,
        reason,
        pause_start: new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_pauses'] }),
  });
}

export function useEndPause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      // Find open pauses for this task and close them
      const { data } = await supabase
        .from('task_pauses' as any)
        .select('id')
        .eq('task_id', taskId)
        .is('pause_end', null);
      const openPauses = (data ?? []) as any[];
      for (const p of openPauses) {
        await supabase
          .from('task_pauses' as any)
          .update({ pause_end: new Date().toISOString() } as any)
          .eq('id', p.id);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_pauses'] }),
  });
}

export function calcTotalPauseMinutes(pauses: TaskPause[]): number {
  let total = 0;
  for (const p of pauses) {
    if (p.pauseEnd) {
      total += (new Date(p.pauseEnd).getTime() - new Date(p.pauseStart).getTime()) / 60000;
    }
  }
  return Math.round(total);
}
