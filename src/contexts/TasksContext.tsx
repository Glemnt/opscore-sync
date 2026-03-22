import { createContext, useContext, ReactNode, useCallback } from 'react';
import { Task, Flow } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
  useTasksQuery, useAddTask, useUpdateTask, useDeleteTask,
} from '@/hooks/useTasksQuery';
import {
  useFlowsQuery, useAddFlow, useUpdateFlow, useDeleteFlow,
  useCustomTemplatesQuery, useAddTemplate, useUpdateTemplate, useRemoveTemplate,
  type CustomTemplate,
} from '@/hooks/useFlowsQuery';
import { useClientFlowsQuery } from '@/hooks/useClientFlowsQuery';
import { useClients } from '@/contexts/ClientsContext';

export type { CustomTemplate };

interface TasksContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  customTemplates: CustomTemplate[];
  addTemplate: (template: CustomTemplate) => void;
  updateTemplate: (id: string, updates: Partial<Omit<CustomTemplate, 'id'>>) => void;
  removeTemplate: (id: string) => void;
  flows: Flow[];
  addFlow: (flow: Flow) => void;
  updateFlow: (id: string, updates: Partial<Omit<Flow, 'id'>>) => void;
  deleteFlow: (id: string) => void;
  clientFlows: Record<string, string[]>;
  assignFlowToClient: (clientId: string, flowId: string) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const { clients } = useClients();
  const addTaskMut = useAddTask();
  const updateTaskMut = useUpdateTask();
  const deleteTaskMut = useDeleteTask();

  const { data: flows = [] } = useFlowsQuery();
  const addFlowMut = useAddFlow();
  const updateFlowMut = useUpdateFlow();
  const deleteFlowMut = useDeleteFlow();

  const { data: customTemplates = [] } = useCustomTemplatesQuery();
  const addTemplateMut = useAddTemplate();
  const updateTemplateMut = useUpdateTemplate();
  const removeTemplateMut = useRemoveTemplate();

  // Load client flows from DB
  const { data: clientFlowsMap = {} } = useClientFlowsQuery();
  const clientFlows: Record<string, string[]> = {};
  for (const [clientId, entries] of Object.entries(clientFlowsMap)) {
    clientFlows[clientId] = entries.map(e => e.flowId);
  }

  const onMutationError = useCallback((err: unknown) => {
    toast({ title: 'Erro ao salvar', description: String(err), variant: 'destructive' });
  }, []);

  const addTask = useCallback((task: Task) => addTaskMut.mutate(task, { onError: onMutationError }), [addTaskMut, onMutationError]);
  const updateTask = useCallback((id: string, updates: Partial<Task>) => updateTaskMut.mutate({ id, updates }, { onError: onMutationError }), [updateTaskMut, onMutationError]);
  const deleteTask = useCallback((id: string) => deleteTaskMut.mutate(id, { onError: onMutationError }), [deleteTaskMut, onMutationError]);

  const addFlow = useCallback((flow: Flow) => addFlowMut.mutate(flow, { onError: onMutationError }), [addFlowMut, onMutationError]);
  const updateFlow = useCallback((id: string, updates: Partial<Omit<Flow, 'id'>>) => updateFlowMut.mutate({ id, updates }, { onError: onMutationError }), [updateFlowMut, onMutationError]);
  const deleteFlow = useCallback((id: string) => deleteFlowMut.mutate(id, { onError: onMutationError }), [deleteFlowMut, onMutationError]);

  const addTemplate = useCallback((t: CustomTemplate) => addTemplateMut.mutate(t, { onError: onMutationError }), [addTemplateMut, onMutationError]);
  const updateTemplate = useCallback((id: string, updates: Partial<Omit<CustomTemplate, 'id'>>) => updateTemplateMut.mutate({ id, updates }, { onError: onMutationError }), [updateTemplateMut, onMutationError]);
  const removeTemplate = useCallback((id: string) => removeTemplateMut.mutate(id, { onError: onMutationError }), [removeTemplateMut, onMutationError]);

  const assignFlowToClient = useCallback((clientId: string, flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    const client = clients.find((c) => c.id === clientId);
    const clientName = client?.name ?? clientId;
    flow.steps.forEach((step) => {
      addTaskMut.mutate({
        id: crypto.randomUUID(),
        title: `${flow.name} - ${step}`,
        clientId,
        clientName,
        responsible: '',
        type: 'setup',
        estimatedTime: 1,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'backlog',
        priority: 'medium',
        comments: `Etapa do fluxo "${flow.name}"`,
        createdAt: new Date().toISOString(),
      }, { onError: onMutationError });
    });
  }, [flows, clients, addTaskMut, onMutationError]);

  return (
    <TasksContext.Provider value={{ tasks, isLoading, addTask, updateTask, deleteTask, customTemplates, addTemplate, updateTemplate, removeTemplate, flows, addFlow, updateFlow, deleteFlow, clientFlows, assignFlowToClient }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks must be used within TasksProvider');
  return context;
}
