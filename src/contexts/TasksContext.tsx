import { createContext, useContext, useState, ReactNode } from 'react';
import { Task, Flow } from '@/types';
import { tasks as initialTasks } from '@/data/mockData';

export interface CustomTemplate {
  id: string;
  name: string;
  subtasks: string[];
}

interface TasksContextType {
  tasks: Task[];
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [clientFlows, setClientFlows] = useState<Record<string, string[]>>({});

  const addTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addTemplate = (template: CustomTemplate) => {
    setCustomTemplates((prev) => [...prev, template]);
  };

  const removeTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTemplate = (id: string, updates: Partial<Omit<CustomTemplate, 'id'>>) => {
    setCustomTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const addFlow = (flow: Flow) => setFlows((prev) => [...prev, flow]);

  const updateFlow = (id: string, updates: Partial<Omit<Flow, 'id'>>) => {
    setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteFlow = (id: string) => setFlows((prev) => prev.filter((f) => f.id !== id));

  const assignFlowToClient = (clientId: string, flowId: string) => {
    setClientFlows((prev) => ({
      ...prev,
      [clientId]: [...(prev[clientId] ?? []), flowId],
    }));
    // Create tasks from flow steps
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;
    const client = tasks.find((t) => t.clientId === clientId);
    const clientName = client?.clientName ?? clientId;
    flow.steps.forEach((step, i) => {
      addTask({
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
  };

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask, customTemplates, addTemplate, updateTemplate, removeTemplate, flows, addFlow, updateFlow, deleteFlow, clientFlows, assignFlowToClient }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks must be used within TasksProvider');
  return context;
}
