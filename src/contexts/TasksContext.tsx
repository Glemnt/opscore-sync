import { createContext, useContext, ReactNode, useCallback } from 'react';
import { Task, Flow } from '@/types';
import {
  useTasksQuery, useAddTask, useUpdateTask, useDeleteTask,
} from '@/hooks/useTasksQuery';
import {
  useFlowsQuery, useAddFlow, useUpdateFlow, useDeleteFlow,
  useCustomTemplatesQuery, useAddTemplate, useUpdateTemplate, useRemoveTemplate,
  type CustomTemplate,
} from '@/hooks/useFlowsQuery';

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

  // clientFlows loaded from DB would need a separate query, keeping simple for now
  const clientFlows: Record<string, string[]> = {};

  const addTask = useCallback((task: Task) => addTaskMut.mutate(task), [addTaskMut]);
  const updateTask = useCallback((id: string, updates: Partial<Task>) => updateTaskMut.mutate({ id, updates }), [updateTaskMut]);
  const deleteTask = useCallback((id: string) => deleteTaskMut.mutate(id), [deleteTaskMut]);

  const addFlow = useCallback((flow: Flow) => addFlowMut.mutate(flow), [addFlowMut]);
  const updateFlow = useCallback((id: string, updates: Partial<Omit<Flow, 'id'>>) => updateFlowMut.mutate({ id, updates }), [updateFlowMut]);
  const deleteFlow = useCallback((id: string) => deleteFlowMut.mutate(id), [deleteFlowMut]);

  const addTemplate = useCallback((t: CustomTemplate) => addTemplateMut.mutate(t), [addTemplateMut]);
  const updateTemplate = useCallback((id: string, updates: Partial<Omit<CustomTemplate, 'id'>>) => updateTemplateMut.mutate({ id, updates }), [updateTemplateMut]);
  const removeTemplate = useCallback((id: string) => removeTemplateMut.mutate(id), [removeTemplateMut]);

  const assignFlowToClient = useCallback((clientId: string, flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    const client = tasks.find((t) => t.clientId === clientId);
    const clientName = client?.clientName ?? clientId;
    flow.steps.forEach((step, i) => {
      addTaskMut.mutate({
        id: `task_flow_${Date.now()}_${i}`,
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
      });
    });
  }, [flows, tasks, addTaskMut]);

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
