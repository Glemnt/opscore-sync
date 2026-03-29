import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NpsResponse {
  id: string;
  clientId: string;
  sentAt: string;
  respondedAt: string | null;
  score: number | null;
  category: string | null;
  likedMost: string;
  improve: string;
  wouldRecommend: boolean | null;
  managerNotified: boolean;
  actionPlan: string;
  createdBy: string;
  createdAt: string;
}

function mapRow(row: any): NpsResponse {
  return {
    id: row.id,
    clientId: row.client_id,
    sentAt: row.sent_at,
    respondedAt: row.responded_at,
    score: row.score,
    category: row.category,
    likedMost: row.liked_most,
    improve: row.improve,
    wouldRecommend: row.would_recommend,
    managerNotified: row.manager_notified,
    actionPlan: row.action_plan,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function getNpsCategory(score: number | null): string | null {
  if (score == null) return null;
  if (score <= 6) return 'detrator';
  if (score <= 8) return 'neutro';
  return 'promotor';
}

export function useNpsResponsesQuery(clientId?: string) {
  return useQuery({
    queryKey: ['nps_responses', clientId],
    queryFn: async () => {
      let q = supabase.from('nps_responses').select('*').order('created_at', { ascending: false });
      if (clientId) q = q.eq('client_id', clientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
}

export function useAddNpsResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      clientId: string;
      score: number;
      likedMost?: string;
      improve?: string;
      wouldRecommend?: boolean;
      createdBy?: string;
    }) => {
      const category = getNpsCategory(params.score);
      const { data, error } = await supabase
        .from('nps_responses')
        .insert({
          client_id: params.clientId,
          score: params.score,
          category,
          responded_at: new Date().toISOString().split('T')[0],
          liked_most: params.likedMost || '',
          improve: params.improve || '',
          would_recommend: params.wouldRecommend ?? null,
          created_by: params.createdBy || '',
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nps_responses'] });
    },
  });
}

export function useUpdateNpsResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      managerNotified?: boolean;
      actionPlan?: string;
    }) => {
      const updates: Record<string, any> = {};
      if (params.managerNotified !== undefined) updates.manager_notified = params.managerNotified;
      if (params.actionPlan !== undefined) updates.action_plan = params.actionPlan;
      const { error } = await supabase
        .from('nps_responses')
        .update(updates)
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nps_responses'] });
    },
  });
}
