import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDbTask, type DbTask, type DbSubtask, type DbTaskChatNote } from '@/types/database';
import type { Task } from '@/types';

interface DbTaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
}

export function useTasksQuery() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const [tasksRes, subtasksRes, notesRes, depsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('subtasks').select('*'),
        supabase.from('task_chat_notes').select('*').order('created_at', { ascending: true }),
        supabase.from('task_dependencies' as any).select('*'),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      const tasks = tasksRes.data as DbTask[];
      const subtasks = (subtasksRes.data ?? []) as DbSubtask[];
      const notes = (notesRes.data ?? []) as DbTaskChatNote[];
      const deps = (depsRes.data ?? []) as unknown as DbTaskDependency[];
      
      // Group dependencies by task_id
      const depsMap: Record<string, string[]> = {};
      for (const d of deps) {
        if (!depsMap[d.task_id]) depsMap[d.task_id] = [];
        depsMap[d.task_id].push(d.depends_on_task_id);
      }
      
      return tasks.map((t) =>
        mapDbTask(
          t,
          subtasks.filter((s) => s.task_id === t.id),
          notes.filter((n) => n.task_id === t.id),
          depsMap[t.id] ?? []
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
        platform_id: task.platformId ?? null,
        etapa: task.etapa ?? '',
        bloqueia_passagem: task.bloqueiaPassagem ?? false,
        depende_cliente: task.dependeCliente ?? false,
        aguardando_cliente: task.aguardandoCliente ?? false,
        origem_tarefa: task.origemTarefa ?? 'manual',
        link_entrega: task.linkEntrega ?? '',
        print_entrega: task.printEntrega ?? '',
        observacao_entrega: task.observacaoEntrega ?? '',
        nota_entrega: task.notaEntrega ?? null,
        approval_status: task.approvalStatus ?? 'pending',
      } as any);
      if (error) throw error;
      // Insert subtasks if any
      if (task.subtasks?.length) {
        const { error: stErr } = await supabase.from('subtasks').insert(
          task.subtasks.map((st) => ({
            id: st.id && st.id.match(/^[0-9a-f]{8}-/) ? st.id : crypto.randomUUID(),
            task_id: taskId,
            label: st.label,
            done: st.done,
          }))
        );
        if (stErr) throw stErr;
      }
      // Insert dependencies if any
      if (task.dependsOn?.length) {
        const { error: depErr } = await supabase.from('task_dependencies' as any).insert(
          task.dependsOn.map((depId) => ({
            task_id: taskId,
            depends_on_task_id: depId,
          }))
        );
        if (depErr) throw depErr;
      }
      return taskId;
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
        motivoAtraso: 'motivo_atraso',
        platformId: 'platform_id', etapa: 'etapa',
        bloqueiaPassagem: 'bloqueia_passagem', dependeCliente: 'depende_cliente',
        aguardandoCliente: 'aguardando_cliente', origemTarefa: 'origem_tarefa',
        linkEntrega: 'link_entrega', printEntrega: 'print_entrega',
        observacaoEntrega: 'observacao_entrega', notaEntrega: 'nota_entrega',
        approvalStatus: 'approval_status',
      };
      for (const [k, v] of Object.entries(updates)) {
        if (k === 'subtasks' || k === 'chatNotes' || k === 'dependsOn') continue;
        const dbKey = keyMap[k] ?? k;
        dbUpdates[dbKey] = v;
      }
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('tasks').update(dbUpdates as any).eq('id', id);
        if (error) throw error;
      }

      // Sync subtasks
      if (updates.subtasks) {
        await supabase.from('subtasks').delete().eq('task_id', id);
        if (updates.subtasks.length > 0) {
          const { error: stErr } = await supabase.from('subtasks').insert(
            updates.subtasks.map((st) => ({
              id: st.id && st.id.match(/^[0-9a-f]{8}-/) ? st.id : crypto.randomUUID(),
              task_id: id,
              label: st.label,
              done: st.done,
              checked_by: (st as any).checkedBy ?? null,
              checked_at: (st as any).checkedAt ?? null,
            }))
          );
          if (stErr) throw stErr;
        }
      }

      // Insert new chat notes
      if (updates.chatNotes?.length) {
        const existingRes = await supabase.from('task_chat_notes').select('id').eq('task_id', id);
        const existingIds = new Set((existingRes.data ?? []).map((n: any) => n.id));
        const newNotes = updates.chatNotes.filter((n) => !existingIds.has(n.id));
        if (newNotes.length > 0) {
          const { error: nErr } = await supabase.from('task_chat_notes').insert(
            newNotes.map((n) => ({
              id: n.id && n.id.match(/^[0-9a-f]{8}-/) ? n.id : crypto.randomUUID(),
              task_id: id,
              message: n.message,
              author: n.author,
            }))
          );
          if (nErr) throw nErr;
        }
      }

      // Sync dependencies
      if (updates.dependsOn !== undefined) {
        await supabase.from('task_dependencies' as any).delete().eq('task_id', id);
        if (updates.dependsOn.length > 0) {
          const { error: depErr } = await supabase.from('task_dependencies' as any).insert(
            updates.dependsOn.map((depId) => ({
              task_id: id,
              depends_on_task_id: depId,
            }))
          );
          if (depErr) throw depErr;
        }
      }
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
