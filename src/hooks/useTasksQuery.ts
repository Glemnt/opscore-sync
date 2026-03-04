import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDbTask, type DbTask, type DbSubtask, type DbTaskChatNote } from '@/types/database';
import type { Task } from '@/types';

export function useTasksQuery() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const [tasksRes, subtasksRes, notesRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('subtasks').select('*'),
        supabase.from('task_chat_notes').select('*').order('created_at', { ascending: true }),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      const tasks = tasksRes.data as DbTask[];
      const subtasks = (subtasksRes.data ?? []) as DbSubtask[];
      const notes = (notesRes.data ?? []) as DbTaskChatNote[];
      return tasks.map((t) =>
        mapDbTask(
          t,
          subtasks.filter((s) => s.task_id === t.id),
          notes.filter((n) => n.task_id === t.id)
        )
      );
    },
  });
}

export function useAddTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Task) => {
      const taskId = task.id && task.id.match(/^[0-9a-f]{8}-/) ? task.id : crypto.randomUUID();
      const { error } = await supabase.from('tasks').insert({
        id: taskId,
        title: task.title,
        client_id: task.clientId,
        client_name: task.clientName,
        project_id: task.projectId ?? null,
        project_name: task.projectName ?? null,
        responsible: task.responsible,
        type: task.type,
        estimated_time: task.estimatedTime,
        real_time: task.realTime ?? null,
        deadline: task.deadline,
        status: task.status as any,
        priority: task.priority,
        comments: task.comments,
        platform: task.platforms ?? null,
        flow_id: (task as any).flowId ?? null,
      });
      if (error) throw error;
      // Insert subtasks if any
      if (task.subtasks?.length) {
        const { error: stErr } = await supabase.from('subtasks').insert(
          task.subtasks.map((st) => ({
            id: st.id,
            task_id: task.id,
            label: st.label,
            done: st.done,
          }))
        );
        if (stErr) throw stErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const dbUpdates: Record<string, any> = {};
      const keyMap: Record<string, string> = {
        clientId: 'client_id', clientName: 'client_name',
        projectId: 'project_id', projectName: 'project_name',
        estimatedTime: 'estimated_time', realTime: 'real_time',
        createdAt: 'created_at', platforms: 'platform', flowId: 'flow_id',
      };
      for (const [k, v] of Object.entries(updates)) {
        if (k === 'subtasks' || k === 'chatNotes') continue;
        const dbKey = keyMap[k] ?? k;
        dbUpdates[dbKey] = v;
      }
      const { error } = await supabase.from('tasks').update(dbUpdates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
