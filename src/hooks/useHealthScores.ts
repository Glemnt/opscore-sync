import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientsQuery } from '@/hooks/useClientsQuery';
import { useTasksQuery } from '@/hooks/useTasksQuery';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { calculateHealthScore, type HealthResult, type ClientPlatformLike } from '@/lib/healthScore';

export function useHealthScores() {
  const { data: clients = [] } = useClientsQuery();
  const { data: tasks = [] } = useTasksQuery();
  const { data: platforms = [] } = useClientPlatformsQuery();

  const scores = useMemo(() => {
    const map: Record<string, HealthResult> = {};
    for (const client of clients) {
      // If override, use stored values
      if ((client as any).healthOverride && client.healthColor) {
        map[client.id] = {
          score: (client as any).healthScore ?? 0,
          color: client.healthColor as any,
          breakdown: {
            tasksScore: 0, platformsScore: 0, responseTimeScore: 0,
            deadlineScore: 0, blocksScore: 0, financeScore: 0, npsScore: 0,
          },
          hasSufficientData: true,
        };
        continue;
      }
      const clientTasks = tasks.filter(t => t.clientId === client.id);
      const clientPlatforms: ClientPlatformLike[] = platforms
        .filter(p => p.clientId === client.id)
        .map(p => ({
          clientId: p.clientId,
          phase: p.phase,
          dependeCliente: p.dependeCliente,
          platformStatus: p.platformStatus,
          deadline: p.deadline,
          dataPrevistaPassagem: p.dataPrevistaPassagem,
        }));
      map[client.id] = calculateHealthScore(client, clientTasks, clientPlatforms);
    }
    return map;
  }, [clients, tasks, platforms]);

  return scores;
}

export function useOverrideHealthScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientId, color, reason, score, changedBy,
    }: {
      clientId: string;
      color: 'green' | 'yellow' | 'red' | 'white';
      reason: string;
      score: number;
      changedBy: string;
    }) => {
      const { error } = await supabase
        .from('clients')
        .update({
          health_color: color as any,
          health_score: score,
          health_override: true,
          health_override_reason: reason,
          health_calculated_at: new Date().toISOString(),
        } as any)
        .eq('id', clientId);
      if (error) throw error;

      // Add changelog entry
      await supabase.from('client_change_logs').insert({
        client_id: clientId,
        field: 'health_override',
        old_value: '',
        new_value: `${color} — ${reason}`,
        changed_by: changedBy,
      });

      // Timeline: health_score_changed
      const { logTimelineEvent } = await import('@/hooks/useTimelineQuery');
      logTimelineEvent({
        clientId,
        eventType: 'health_score_changed',
        description: `Saúde sobrescrita manualmente para ${color}: ${reason}`,
        newValue: `${color} (${score})`,
        triggeredBy: changedBy,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useRemoveHealthOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, changedBy }: { clientId: string; changedBy: string }) => {
      const { error } = await supabase
        .from('clients')
        .update({
          health_override: false,
          health_override_reason: '',
        } as any)
        .eq('id', clientId);
      if (error) throw error;

      await supabase.from('client_change_logs').insert({
        client_id: clientId,
        field: 'health_override',
        old_value: 'manual',
        new_value: 'automático',
        changed_by: changedBy,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
