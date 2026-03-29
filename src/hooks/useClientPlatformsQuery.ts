import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logTimelineEvent } from '@/hooks/useTimelineQuery';

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
    platformStatus: row.platform_status ?? 'nao_iniciada',
    motivoAtraso: row.motivo_atraso ?? '',
    prazoInterno: row.prazo_interno ?? null,
    dataPrevistaPassagem: row.data_prevista_passagem ?? null,
    dataRealPassagem: row.data_real_passagem ?? null,
    dependeCliente: row.depende_cliente ?? false,
    prontaPerformance: row.pronta_performance ?? false,
    quemAprovouPassagem: row.quem_aprovou_passagem ?? '',
    observacaoPassagem: row.observacao_passagem ?? '',
    pendenciasRemanescentes: row.pendencias_remanescentes ?? '',
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
    mutationFn: async (input: { clientId: string; platformSlug: string; phase?: string; responsible?: string; squadId?: string | null; startDate?: string; deadline?: string | null; qualityLevel?: string; healthColor?: string; revenueTier?: string; origin?: string; salesResponsible?: string; triggeredBy?: string }) => {
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

      // Timeline: platform_added
      logTimelineEvent({
        clientId: input.clientId,
        eventType: 'platform_added',
        description: `Plataforma "${input.platformSlug}" adicionada`,
        triggeredBy: input.triggeredBy ?? 'Sistema',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
  });
}

export function useUpdateClientPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, _meta }: { id: string; updates: Record<string, any>; _meta?: { clientId?: string; platformSlug?: string; triggeredBy?: string; oldValues?: Record<string, any> } }) => {
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
        platformStatus: 'platform_status',
        motivoAtraso: 'motivo_atraso',
        prazoInterno: 'prazo_interno',
        dataPrevistaPassagem: 'data_prevista_passagem',
        dataRealPassagem: 'data_real_passagem',
        dependeCliente: 'depende_cliente',
        prontaPerformance: 'pronta_performance',
        quemAprovouPassagem: 'quem_aprovou_passagem',
        observacaoPassagem: 'observacao_passagem',
        pendenciasRemanescentes: 'pendencias_remanescentes',
        notes: 'notes',
      };
      for (const [k, v] of Object.entries(updates)) {
        dbUpdates[keyMap[k] ?? k] = v;
      }
      const { error } = await supabase.from('client_platforms').update(dbUpdates).eq('id', id);
      if (error) throw error;

      // Timeline logging for key platform changes
      if (_meta?.clientId) {
        const userName = _meta.triggeredBy ?? 'Sistema';
        const slug = _meta.platformSlug ?? '';

        if (updates.phase !== undefined || updates.platform_status !== undefined) {
          const phase = updates.phase ?? updates.platform_status;
          if (phase === 'performance') {
            logTimelineEvent({ clientId: _meta.clientId, platformId: id, eventType: 'platform_to_performance', description: `Plataforma "${slug}" passou para performance`, triggeredBy: userName });
          } else if (phase === 'escala') {
            logTimelineEvent({ clientId: _meta.clientId, platformId: id, eventType: 'platform_to_scale', description: `Plataforma "${slug}" passou para escala`, triggeredBy: userName });
          } else if (updates.phase !== undefined) {
            logTimelineEvent({ clientId: _meta.clientId, platformId: id, eventType: 'platform_phase_changed', description: `Fase da plataforma "${slug}" alterada para "${phase}"`, newValue: String(phase), triggeredBy: userName });
          } else {
            logTimelineEvent({ clientId: _meta.clientId, platformId: id, eventType: 'platform_status_changed', description: `Status da plataforma "${slug}" alterado para "${phase}"`, newValue: String(phase), triggeredBy: userName });
          }
        }

        if (updates.responsible !== undefined) {
          logTimelineEvent({ clientId: _meta.clientId, platformId: id, eventType: 'responsible_changed', description: `Responsável da plataforma "${slug}" alterado para "${updates.responsible}"`, newValue: updates.responsible, triggeredBy: userName });
        }

        if (updates.prontaPerformance === true) {
          logTimelineEvent({ clientId: _meta.clientId, platformId: id, eventType: 'platform_to_performance', description: `Plataforma "${slug}" marcada como pronta para performance`, triggeredBy: userName });
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
  });
}

export function useDeleteClientPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: string | { id: string; clientId?: string; platformSlug?: string; triggeredBy?: string }) => {
      const id = typeof input === 'string' ? input : input.id;
      const { error } = await supabase.from('client_platforms').delete().eq('id', id);
      if (error) throw error;

      if (typeof input !== 'string' && input.clientId) {
        logTimelineEvent({
          clientId: input.clientId,
          eventType: 'platform_removed',
          description: `Plataforma "${input.platformSlug ?? ''}" removida`,
          triggeredBy: input.triggeredBy ?? 'Sistema',
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client_platforms'] }),
  });
}
