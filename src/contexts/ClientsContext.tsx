import { createContext, useContext, ReactNode, useCallback } from 'react';
import { Client, ChangeLogEntry, ChatNote } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSquadsQuery } from '@/hooks/useSquadsQuery';
import {
  useClientsQuery,
  useAddClient,
  useUpdateClient,
  useDeleteClient,
  useAddChangeLog,
  useAddClientChatNote,
} from '@/hooks/useClientsQuery';

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

interface ClientsContextType {
  clients: Client[];
  isLoading: boolean;
  addClient: (client: Client, callbacks?: MutationCallbacks) => void;
  deleteClient: (clientId: string) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  updateClientField: (clientId: string, field: string, value: any, fieldLabel: string) => void;
  addChatNote: (clientId: string, message: string) => void;
  getVisibleClients: () => Client[];
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { data: clients = [], isLoading } = useClientsQuery();
  const { data: squads = [] } = useSquadsQuery();
  const addClientMut = useAddClient();
  const updateClientMut = useUpdateClient();
  const deleteClientMut = useDeleteClient();
  const addChangeLogMut = useAddChangeLog();
  const addChatNoteMut = useAddClientChatNote();

  const addClient = useCallback((client: Client, callbacks?: MutationCallbacks) => {
    addClientMut.mutate(client, {
      onSuccess: () => callbacks?.onSuccess?.(),
      onError: (err) => {
        toast({ title: 'Erro ao adicionar cliente', description: String(err), variant: 'destructive' });
        callbacks?.onError?.(err);
      },
    });
  }, [addClientMut]);

  const deleteClient = useCallback((clientId: string) => {
    deleteClientMut.mutate(clientId, {
      onError: (err) => toast({ title: 'Erro ao excluir cliente', description: String(err), variant: 'destructive' }),
    });
  }, [deleteClientMut]);

  const updateClient = useCallback((clientId: string, updates: Partial<Client>) => {
    // Log changes
    const existing = clients.find((c) => c.id === clientId);
    if (existing) {
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'changeLogs' || key === 'chatNotes') continue;
        const oldVal = String((existing as any)[key] ?? '');
        const newVal = String(value ?? '');
        if (oldVal !== newVal) {
          addChangeLogMut.mutate({
            clientId,
            field: key,
            oldValue: oldVal,
            newValue: newVal,
            changedBy: currentUser?.name ?? 'Sistema',
          });
        }
      }
    }
    updateClientMut.mutate({ id: clientId, updates });
  }, [clients, currentUser, updateClientMut, addChangeLogMut]);

  const updateClientField = useCallback((clientId: string, field: string, value: any, fieldLabel: string) => {
    const existing = clients.find((c) => c.id === clientId);
    if (existing) {
      addChangeLogMut.mutate({
        clientId,
        field: fieldLabel,
        oldValue: String((existing as any)[field] ?? ''),
        newValue: String(value),
        changedBy: currentUser?.name ?? 'Sistema',
      });
    }
    updateClientMut.mutate({ id: clientId, updates: { [field]: value } });
  }, [clients, currentUser, updateClientMut, addChangeLogMut]);

  const addChatNote = useCallback((clientId: string, message: string) => {
    addChatNoteMut.mutate({
      clientId,
      message,
      author: currentUser?.name ?? 'Sistema',
    });
  }, [currentUser, addChatNoteMut]);

  const getVisibleClients = useCallback((): Client[] => {
    if (!currentUser) return [];
    return clients;
  }, [currentUser, clients]);

  return (
    <ClientsContext.Provider value={{ clients, isLoading, addClient, deleteClient, updateClient, updateClientField, addChatNote, getVisibleClients }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientsContext);
  if (!context) throw new Error('useClients must be used within ClientsProvider');
  return context;
}
