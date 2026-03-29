import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  // Operational fields
  platformStatus: string;
  motivoAtraso: string;
  prazoInterno: string | null;
  dataPrevistaPassagem: string | null;
  dataRealPassagem: string | null;
  dependeCliente: boolean;
  prontaPerformance: boolean;
  quemAprovouPassagem: string;
  observacaoPassagem: string;
  pendenciasRemanescentes: string;
}

function mapRow(row: any): ClientPlatform {
  return {
    id: row.id,
    clientId: row.client_id,
    platformSlug: row.platform_slug,
    phase: row.phase ?? 'onboarding',
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
        deadline: 'deadline',
        notes: 'notes',
      };
      for (const [k, v] of Object.entries(updates)) {
        dbUpdates[keyMap[k] ?? k] = v;
      }
      const { error } = await supabase.from('client_platforms').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
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
