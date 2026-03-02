import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientFlowRecord {
  id: string;
  client_id: string;
  flow_id: string;
  flow_name?: string;
}

export function useClientFlowsQuery() {
  return useQuery({
    queryKey: ['client_flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_flows')
        .select('id, client_id, flow_id, flows(name)');
      if (error) throw error;
      // Build a map: clientId → { flowId, flowName }[]
      const map: Record<string, { flowId: string; flowName: string }[]> = {};
      for (const row of data ?? []) {
        const clientId = row.client_id;
        if (!map[clientId]) map[clientId] = [];
        const flowName = (row as any).flows?.name ?? '';
        map[clientId].push({ flowId: row.flow_id, flowName });
      }
      return map;
    },
  });
}

export function useAddClientFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, flowId }: { clientId: string; flowId: string }) => {
      const { error } = await supabase.from('client_flows').insert({ client_id: clientId, flow_id: flowId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_flows'] }),
  });
}

export function useRemoveClientFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, flowId }: { clientId: string; flowId: string }) => {
      const { error } = await supabase.from('client_flows').delete().eq('client_id', clientId).eq('flow_id', flowId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_flows'] }),
  });
}
