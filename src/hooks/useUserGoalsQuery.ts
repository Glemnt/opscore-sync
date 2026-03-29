import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, startOfMonth, format } from 'date-fns';

export interface UserGoal {
  id: string;
  userId: string;
  period: string;
  periodStart: string;
  metaPassagens: number;
  metaDestravamentos: number;
  metaReducaoBacklog: number;
  metaAnunciosDia: number;
  metaAnunciosCliente: number;
  createdBy: string;
  createdAt: string;
}

function mapRow(row: any): UserGoal {
  return {
    id: row.id,
    userId: row.user_id,
    period: row.period,
    periodStart: row.period_start,
    metaPassagens: row.meta_passagens,
    metaDestravamentos: row.meta_destravamentos,
    metaReducaoBacklog: row.meta_reducao_backlog,
    metaAnunciosDia: row.meta_anuncios_dia,
    metaAnunciosCliente: row.meta_anuncios_cliente,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function useUserGoalsQuery(userId?: string) {
  return useQuery({
    queryKey: ['user_goals', userId],
    queryFn: async () => {
      let q = supabase.from('user_goals').select('*').order('period_start', { ascending: false });
      if (userId) q = q.eq('user_id', userId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
}

export function useCurrentGoal(userId: string | undefined, period: 'weekly' | 'monthly' = 'weekly') {
  const now = new Date();
  const periodStart = period === 'weekly'
    ? format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    : format(startOfMonth(now), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['user_goals', userId, period, periodStart],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId!)
        .eq('period', period)
        .eq('period_start', periodStart)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
  });
}

export function useUpsertUserGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      userId: string;
      period?: string;
      periodStart?: string;
      metaPassagens?: number;
      metaDestravamentos?: number;
      metaReducaoBacklog?: number;
      metaAnunciosDia?: number;
      metaAnunciosCliente?: number;
      createdBy?: string;
    }) => {
      const now = new Date();
      const period = params.period || 'weekly';
      const periodStart = params.periodStart || (
        period === 'weekly'
          ? format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
          : format(startOfMonth(now), 'yyyy-MM-dd')
      );

      const { data, error } = await supabase
        .from('user_goals')
        .upsert({
          user_id: params.userId,
          period,
          period_start: periodStart,
          meta_passagens: params.metaPassagens ?? 5,
          meta_destravamentos: params.metaDestravamentos ?? 3,
          meta_reducao_backlog: params.metaReducaoBacklog ?? 5,
          meta_anuncios_dia: params.metaAnunciosDia ?? 24,
          meta_anuncios_cliente: params.metaAnunciosCliente ?? 75,
          created_by: params.createdBy || '',
        }, { onConflict: 'user_id,period,period_start' })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user_goals'] });
    },
  });
}
