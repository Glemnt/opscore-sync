import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Client, ChangeLogEntry, ChatNote } from '@/types';
import { clients as initialClients } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  updateClientField: (clientId: string, field: string, value: any, fieldLabel: string) => void;
  addChatNote: (clientId: string, message: string) => void;
  getVisibleClients: () => Client[];
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<Client[]>(initialClients);

  const addClient = useCallback((client: Client) => {
    setClients(prev => [...prev, client]);
  }, []);

  const deleteClient = useCallback((clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
  }, []);

  const updateClient = useCallback((clientId: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const newLogs: ChangeLogEntry[] = [];
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'changeLogs' || key === 'chatNotes') continue;
        const oldVal = String((c as any)[key] ?? '');
        const newVal = String(value ?? '');
        if (oldVal !== newVal) {
          newLogs.push({
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            field: key,
            oldValue: oldVal,
            newValue: newVal,
            changedBy: currentUser?.name ?? 'Sistema',
            changedAt: new Date().toISOString(),
          });
        }
      }
      return { ...c, ...updates, changeLogs: [...c.changeLogs, ...newLogs] };
    }));
  }, [currentUser]);

  const updateClientField = useCallback((clientId: string, field: string, value: any, fieldLabel: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const oldValue = String((c as any)[field] ?? '');
      const logEntry: ChangeLogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        field: fieldLabel,
        oldValue,
        newValue: String(value),
        changedBy: currentUser?.name ?? 'Sistema',
        changedAt: new Date().toISOString(),
      };
      return {
        ...c,
        [field]: value,
        changeLogs: [...c.changeLogs, logEntry],
      };
    }));
  }, [currentUser]);

  const addChatNote = useCallback((clientId: string, message: string) => {
    const note: ChatNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      message,
      author: currentUser?.name ?? 'Sistema',
      createdAt: new Date().toISOString(),
    };
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, chatNotes: [...c.chatNotes, note] } : c
    ));
  }, [currentUser]);

  const getVisibleClients = useCallback((): Client[] => {
    if (!currentUser) return [];
    if (currentUser.accessLevel === 3) return clients;
    return clients.filter(c => currentUser.squadIds.includes(c.squadId));
  }, [currentUser, clients]);

  return (
    <ClientsContext.Provider value={{ clients, addClient, deleteClient, updateClient, updateClientField, addChatNote, getVisibleClients }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientsContext);
  if (!context) throw new Error('useClients must be used within ClientsProvider');
  return context;
}
