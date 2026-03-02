import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDbClient, type DbClient, type DbChangeLog, type DbChatNote } from '@/types/database';
import type { Client } from '@/types';

export function useClientsQuery() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const [clientsRes, logsRes, notesRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('client_change_logs').select('*').order('changed_at', { ascending: true }),
        supabase.from('client_chat_notes').select('*').order('created_at', { ascending: true }),
      ]);
      if (clientsRes.error) throw clientsRes.error;
      const clients = clientsRes.data as DbClient[];
      const logs = (logsRes.data ?? []) as DbChangeLog[];
      const notes = (notesRes.data ?? []) as DbChatNote[];

      return clients.map((c) =>
        mapDbClient(
          c,
          logs.filter((l) => l.client_id === c.id),
          notes.filter((n) => n.client_id === c.id)
        )
      );
    },
  });
}

export function useAddClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Client) => {
      const { error } = await supabase.from('clients').insert({
        id: client.id,
        name: client.name,
        company_name: client.companyName,
        segment: client.segment,
        responsible: client.responsible,
        squad_id: client.squadId || null,
        start_date: client.startDate,
        status: client.status as any,
        notes: client.notes,
        logo: client.logo ?? null,
        monthly_revenue: client.monthlyRevenue ?? null,
        active_projects: client.activeProjects,
        pending_tasks: client.pendingTasks,
        contract_type: client.contractType,
        payment_day: client.paymentDay,
        contract_duration_months: client.contractDurationMonths ?? null,
        platforms: (client.platforms as any) ?? null,
        health_color: client.healthColor ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      // Map camelCase to snake_case for DB
      const dbUpdates: Record<string, any> = {};
      const keyMap: Record<string, string> = {
        companyName: 'company_name', squadId: 'squad_id', startDate: 'start_date',
        monthlyRevenue: 'monthly_revenue', activeProjects: 'active_projects',
        pendingTasks: 'pending_tasks', contractType: 'contract_type',
        paymentDay: 'payment_day', contractDurationMonths: 'contract_duration_months',
        healthColor: 'health_color',
      };
      for (const [k, v] of Object.entries(updates)) {
        if (k === 'changeLogs' || k === 'chatNotes') continue;
        dbUpdates[keyMap[k] ?? k] = v;
      }
      const { error } = await supabase.from('clients').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useAddChangeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: { clientId: string; field: string; oldValue: string; newValue: string; changedBy: string }) => {
      const { error } = await supabase.from('client_change_logs').insert({
        client_id: log.clientId,
        field: log.field,
        old_value: log.oldValue,
        new_value: log.newValue,
        changed_by: log.changedBy,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useAddClientChatNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: { clientId: string; message: string; author: string }) => {
      const { error } = await supabase.from('client_chat_notes').insert({
        client_id: note.clientId,
        message: note.message,
        author: note.author,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
