import { createContext, useContext, useState, ReactNode } from 'react';
import { Task } from '@/types';
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
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

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

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask, customTemplates, addTemplate, updateTemplate, removeTemplate }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks must be used within TasksProvider');
  return context;
}
