import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JourneyTemplate {
  id: string;
  title: string;
  dayNumber: number;
  phase: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface JourneyItem {
  id: string;
  clientId: string;
  templateId: string | null;
  scheduledDate: string;
  actualDate: string | null;
  status: string;
  completedBy: string;
  completedAt: string | null;
  notes: string;
  link: string;
  title: string;
  dayNumber: number;
  phase: string;
  createdAt: string;
}

function mapTemplate(row: any): JourneyTemplate {
  return {
    id: row.id,
    title: row.title,
    dayNumber: row.day_number,
    phase: row.phase,
    description: row.description,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

function mapItem(row: any): JourneyItem {
  return {
    id: row.id,
    clientId: row.client_id,
    templateId: row.template_id,
    scheduledDate: row.scheduled_date,
    actualDate: row.actual_date,
    status: row.status,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    notes: row.notes,
    link: row.link,
    title: row.title,
    dayNumber: row.day_number,
    phase: row.phase,
    createdAt: row.created_at,
  };
}

// Helper: add business days to a date
function addBusinessDays(start: Date, days: number): Date {
  let count = 0;
  const result = new Date(start);
  while (count < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return result;
}

export function useCsJourneyTemplatesQuery() {
  return useQuery({
    queryKey: ['cs_journey_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cs_journey_templates' as any)
        .select('*')
        .order('day_number', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapTemplate);
    },
  });
}

export function useAddJourneyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { title: string; dayNumber: number; phase: string; description?: string }) => {
      const { error } = await supabase.from('cs_journey_templates' as any).insert({
        title: t.title,
        day_number: t.dayNumber,
        phase: t.phase,
        description: t.description ?? '',
        sort_order: t.dayNumber,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs_journey_templates'] }),
  });
}

export function useUpdateJourneyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const dbUpdates: Record<string, any> = {};
      const map: Record<string, string> = {
        title: 'title', dayNumber: 'day_number', phase: 'phase',
        description: 'description', isActive: 'is_active', sortOrder: 'sort_order',
      };
      for (const [k, v] of Object.entries(updates)) {
        dbUpdates[map[k] ?? k] = v;
      }
      const { error } = await supabase.from('cs_journey_templates' as any).update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs_journey_templates'] }),
  });
}

export function useDeleteJourneyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cs_journey_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs_journey_templates'] }),
  });
}

export function useCsJourneyItemsQuery(clientId?: string) {
  return useQuery({
    queryKey: ['cs_journey_items', clientId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('cs_journey_items' as any).select('*').order('day_number', { ascending: true });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapItem);
    },
  });
}

export function useUpdateJourneyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const dbUpdates: Record<string, any> = {};
      const map: Record<string, string> = {
        status: 'status', notes: 'notes', link: 'link',
        actualDate: 'actual_date', completedBy: 'completed_by', completedAt: 'completed_at',
      };
      for (const [k, v] of Object.entries(updates)) {
        dbUpdates[map[k] ?? k] = v;
      }
      const { error } = await supabase.from('cs_journey_items' as any).update(dbUpdates).eq('id', id);
      if (error) throw error;

      // Timeline: journey_meeting when completed
      if (updates.status === 'feita') {
        // Fetch the item to get clientId
        const { data: item } = await supabase.from('cs_journey_items' as any).select('client_id, title').eq('id', id).single();
        if (item) {
          const { logTimelineEvent } = await import('@/hooks/useTimelineQuery');
          logTimelineEvent({
            clientId: (item as any).client_id,
            eventType: 'journey_meeting',
            description: `Reunião "${(item as any).title}" realizada`,
            triggeredBy: updates.completedBy ?? 'Sistema',
          });
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs_journey_items'] }),
  });
}

export function useGenerateJourneyForClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, startDate }: { clientId: string; startDate: string }) => {
      // Check if journey already exists
      const { data: existing } = await supabase
        .from('cs_journey_items' as any)
        .select('id')
        .eq('client_id', clientId)
        .limit(1);
      if (existing && existing.length > 0) return; // already generated

      // Get active templates
      const { data: templates, error: tErr } = await supabase
        .from('cs_journey_templates' as any)
        .select('*')
        .eq('is_active', true)
        .order('day_number', { ascending: true });
      if (tErr) throw tErr;
      if (!templates || templates.length === 0) return;

      const start = new Date(startDate + 'T00:00:00');
      const items = templates.map((t: any) => ({
        client_id: clientId,
        template_id: t.id,
        scheduled_date: addBusinessDays(start, t.day_number).toISOString().split('T')[0],
        title: t.title,
        day_number: t.day_number,
        phase: t.phase,
        status: 'pendente',
      }));

      const { error } = await supabase.from('cs_journey_items' as any).insert(items as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cs_journey_items'] }),
  });
}

export const PHASE_LABELS: Record<string, string> = {
  onboard: 'Onboard (D1-D15)',
  primeiros_resultados: 'Primeiros Resultados (D16-D30)',
  estabilizacao: 'Estabilização (D31-D60)',
  consolidacao: 'Consolidação (D61-D90)',
};

export const PHASE_OPTIONS = ['onboard', 'primeiros_resultados', 'estabilizacao', 'consolidacao'];
