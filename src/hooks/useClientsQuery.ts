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
        setup_fee: client.setupFee ?? null,
        phone: client.phone ?? '',
        cnpj: client.cnpj ?? '',
        email: client.email ?? '',
        origin: (client as any).origin ?? '',
        razao_social: client.razaoSocial ?? '',
        perfil_cliente: client.perfilCliente ?? 'brasileiro',
        endereco: client.endereco ?? '',
        cidade: client.cidade ?? '',
        estado: client.estado ?? '',
        logistica_principal: client.logisticaPrincipal ?? '',
        nome_proprietario: client.nomeProprietario ?? '',
        cpf_responsavel: client.cpfResponsavel ?? '',
        cs_responsavel: client.csResponsavel ?? '',
        manager: client.manager ?? '',
        auxiliar: client.auxiliar ?? '',
        assistente: client.assistente ?? '',
        consultor_atual: client.consultorAtual ?? '',
        vendedor: client.vendedor ?? '',
        status_financeiro: client.statusFinanceiro ?? 'em_dia',
        multa_rescisoria: client.multaRescisoria ?? null,
        data_fim_prevista: client.dataFimPrevista ?? null,
        fase_macro: client.faseMacro ?? 'implementacao',
        sub_status: client.subStatus ?? null,
        ultimo_contato: client.ultimoContato ?? null,
        ultima_resposta_cliente: client.ultimaRespostaCliente ?? null,
        motivo_atraso_geral: client.motivoAtrasoGeral ?? '',
        risco_churn: client.riscoChurn ?? 'baixo',
        tipo_cliente: client.tipoCliente ?? 'seller',
        data_prevista_passagem: client.dataPrevistaPassagem ?? null,
        data_real_passagem: client.dataRealPassagem ?? null,
        prioridade_geral: client.prioridadeGeral ?? 'P2',
        nps_ultimo: client.npsUltimo ?? null,
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
        healthColor: 'health_color', setupFee: 'setup_fee',
        phase: 'phase', phone: 'phone', cnpj: 'cnpj', email: 'email',
        razaoSocial: 'razao_social', perfilCliente: 'perfil_cliente',
        endereco: 'endereco', cidade: 'cidade', estado: 'estado',
        logisticaPrincipal: 'logistica_principal', nomeProprietario: 'nome_proprietario',
        cpfResponsavel: 'cpf_responsavel', csResponsavel: 'cs_responsavel',
        manager: 'manager', auxiliar: 'auxiliar', assistente: 'assistente',
        consultorAtual: 'consultor_atual', vendedor: 'vendedor',
        statusFinanceiro: 'status_financeiro', multaRescisoria: 'multa_rescisoria',
        dataFimPrevista: 'data_fim_prevista', faseMacro: 'fase_macro',
        subStatus: 'sub_status', ultimoContato: 'ultimo_contato',
        ultimaRespostaCliente: 'ultima_resposta_cliente',
        motivoAtrasoGeral: 'motivo_atraso_geral', riscoChurn: 'risco_churn',
        tipoCliente: 'tipo_cliente', dataPrevistaPassagem: 'data_prevista_passagem',
        dataRealPassagem: 'data_real_passagem', prioridadeGeral: 'prioridade_geral',
        npsUltimo: 'nps_ultimo',
      };
      for (const [k, v] of Object.entries(updates)) {
        if (k === 'changeLogs' || k === 'chatNotes') continue;
        dbUpdates[keyMap[k] ?? k] = v;
      }
      const { error } = await supabase.from('clients').update(dbUpdates).eq('id', id);
      if (error) throw error;
      // Propagate squad change to client_platforms
      if (dbUpdates.squad_id !== undefined) {
        await supabase
          .from('client_platforms')
          .update({ squad_id: dbUpdates.squad_id })
          .eq('client_id', id);
      }
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
