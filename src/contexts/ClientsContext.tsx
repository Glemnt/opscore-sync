import { createContext, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
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
import { useGenerateJourneyForClient } from '@/hooks/useCsJourneyQuery';
import { logTimelineEvent } from '@/hooks/useTimelineQuery';

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
  const generateJourney = useGenerateJourneyForClient();

  const addClient = useCallback((client: Client, callbacks?: MutationCallbacks) => {
    addClientMut.mutate(client, {
      onSuccess: () => {
        // Auto-generate CS journey
        generateJourney.mutate({ clientId: client.id, startDate: client.startDate });
        // Timeline: client_created
        logTimelineEvent({
          clientId: client.id,
          eventType: 'client_created',
          description: `Cliente "${client.name}" criado`,
          triggeredBy: currentUser?.name ?? 'Sistema',
        });
        callbacks?.onSuccess?.();
      },
      onError: (err) => {
        toast({ title: 'Erro ao adicionar cliente', description: String(err), variant: 'destructive' });
        callbacks?.onError?.(err);
      },
    });
  }, [addClientMut, generateJourney, currentUser]);

  const deleteClient = useCallback((clientId: string) => {
    deleteClientMut.mutate(clientId, {
      onError: (err) => toast({ title: 'Erro ao excluir cliente', description: String(err), variant: 'destructive' }),
    });
  }, [deleteClientMut]);

  const updateClient = useCallback((clientId: string, updates: Partial<Client>) => {
    const existing = clients.find((c) => c.id === clientId);
    const userName = currentUser?.name ?? 'Sistema';
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
            changedBy: userName,
          });

          // Timeline events for key fields
          if (key === 'phase' || key === 'faseMacro') {
            logTimelineEvent({
              clientId, eventType: 'client_phase_changed',
              description: `Fase alterada de "${oldVal}" para "${newVal}"`,
              oldValue: oldVal, newValue: newVal, triggeredBy: userName,
            });
          } else if (key === 'status') {
            if (newVal === 'paused' || newVal === 'pausado') {
              logTimelineEvent({ clientId, eventType: 'client_paused', description: `Cliente pausado`, oldValue: oldVal, newValue: newVal, triggeredBy: userName });
            } else if (newVal === 'churned' || newVal === 'cancelado') {
              logTimelineEvent({ clientId, eventType: 'client_churn', description: `Cliente cancelado/churn`, oldValue: oldVal, newValue: newVal, triggeredBy: userName });
            } else {
              logTimelineEvent({ clientId, eventType: 'general_change', description: `Status alterado de "${oldVal}" para "${newVal}"`, oldValue: oldVal, newValue: newVal, triggeredBy: userName });
            }
          } else if (key === 'responsible' || key === 'csResponsavel' || key === 'consultorAtual') {
            logTimelineEvent({ clientId, eventType: 'responsible_changed', description: `${key} alterado de "${oldVal}" para "${newVal}"`, oldValue: oldVal, newValue: newVal, triggeredBy: userName });
          } else if (key === 'npsUltimo') {
            logTimelineEvent({ clientId, eventType: 'nps_registered', description: `NPS registrado: ${newVal}`, newValue: newVal, triggeredBy: userName });
          }
        }
      }
    }
    updateClientMut.mutate({ id: clientId, updates }, {
      onError: (err) => toast({ title: 'Erro ao atualizar cliente', description: String(err), variant: 'destructive' }),
    });
  }, [clients, currentUser, updateClientMut, addChangeLogMut]);

  const updateClientField = useCallback((clientId: string, field: string, value: any, fieldLabel: string) => {
    const existing = clients.find((c) => c.id === clientId);
    const userName = currentUser?.name ?? 'Sistema';
    if (existing) {
      addChangeLogMut.mutate({
        clientId,
        field: fieldLabel,
        oldValue: String((existing as any)[field] ?? ''),
        newValue: String(value),
        changedBy: userName,
      });
    }
    updateClientMut.mutate({ id: clientId, updates: { [field]: value } }, {
      onError: (err) => toast({ title: 'Erro ao atualizar campo', description: String(err), variant: 'destructive' }),
    });
  }, [clients, currentUser, updateClientMut, addChangeLogMut]);

  const addChatNote = useCallback((clientId: string, message: string) => {
    addChatNoteMut.mutate({
      clientId,
      message,
      author: currentUser?.name ?? 'Sistema',
    });
    logTimelineEvent({
      clientId, eventType: 'client_contact',
      description: `Observação registrada: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
      triggeredBy: currentUser?.name ?? 'Sistema',
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
