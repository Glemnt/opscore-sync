import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { insertPlatformChangeLog } from '@/hooks/usePlatformChangeLogsQuery';

export interface ClientPlatform {
  id: string;
  clientId: string;
  platformSlug: string;
  phase: string;
  responsible: string;
  squadId: string | null;
  startDate: string | null;
  deadline: string | null;
  notes: string;
  platformAttributes: Record<string, any>;
  qualityLevel: string | null;
  healthColor: string | null;
  revenueTier: string | null;
  origin: string;
  salesResponsible: string;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: any): ClientPlatform {
  return {
    id: row.id,
    clientId: row.client_id,
    platformSlug: row.platform_slug,
    phase: row.phase,
    responsible: row.responsible,
    squadId: row.squad_id,
    startDate: row.start_date,
    deadline: row.deadline,
    notes: row.notes,
    platformAttributes: row.platform_attributes ?? {},
    qualityLevel: row.quality_level ?? null,
    healthColor: row.health_color ?? null,
    revenueTier: row.revenue_tier ?? null,
    origin: row.origin ?? '',
    salesResponsible: row.sales_responsible ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useClientPlatformsQuery() {
  return useQuery({
    queryKey: ['client_platforms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_platforms').select('*');
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useAddClientPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { clientId: string; platformSlug: string; phase?: string; responsible?: string; squadId?: string | null; startDate?: string; deadline?: string | null; qualityLevel?: string; healthColor?: string; revenueTier?: string; origin?: string; salesResponsible?: string }) => {
      const { error } = await supabase.from('client_platforms').insert({
        client_id: input.clientId,
        platform_slug: input.platformSlug,
        phase: input.phase ?? 'onboarding',
        responsible: input.responsible ?? '',
        squad_id: input.squadId ?? null,
        start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
        deadline: input.deadline ?? null,
        quality_level: input.qualityLevel ?? null,
        health_color: input.healthColor ?? null,
        revenue_tier: input.revenueTier ?? null,
        origin: input.origin ?? '',
        sales_responsible: input.salesResponsible ?? '',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
  });
}

export function useUpdateClientPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      // Fetch current record for change logging
      const { data: currentRow } = await supabase.from('client_platforms').select('*').eq('id', id).single();

      const dbUpdates: Record<string, any> = {};
      const keyMap: Record<string, string> = {
        platformSlug: 'platform_slug',
        squadId: 'squad_id',
        startDate: 'start_date',
        platformAttributes: 'platform_attributes',
        qualityLevel: 'quality_level',
        healthColor: 'health_color',
        revenueTier: 'revenue_tier',
        origin: 'origin',
        salesResponsible: 'sales_responsible',
      };
      for (const [k, v] of Object.entries(updates)) {
        dbUpdates[keyMap[k] ?? k] = v;
      }
      const { error } = await supabase.from('client_platforms').update(dbUpdates).eq('id', id);
      if (error) throw error;

      // Auto-log changes
      if (currentRow) {
        const fieldLabels: Record<string, string> = {
          phase: 'Fase', squad_id: 'Squad', responsible: 'Responsável',
          quality_level: 'Nível Qualidade', health_color: 'Saúde',
          revenue_tier: 'Faixa Receita', origin: 'Origem',
          sales_responsible: 'Resp. Comercial', deadline: 'Prazo',
          platform_attributes: 'Atributos',
        };
        for (const [dbKey, newVal] of Object.entries(dbUpdates)) {
          const oldVal = (currentRow as any)[dbKey];
          const oldStr = oldVal == null ? '' : typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal);
          const newStr = newVal == null ? '' : typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal);
          if (oldStr !== newStr) {
            await insertPlatformChangeLog({
              clientPlatformId: id,
              field: fieldLabels[dbKey] ?? dbKey,
              oldValue: oldStr,
              newValue: newStr,
              changedBy: 'Usuário',
            });
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client_platforms'] });
      qc.invalidateQueries({ queryKey: ['platform_change_logs'] });
    },
  });
}

export function useDeleteClientPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_platforms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
  });
}
