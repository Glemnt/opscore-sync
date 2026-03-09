import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformChangeLog {
  id: string;
  clientPlatformId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export function usePlatformChangeLogsQuery(platformId: string | undefined) {
  return useQuery({
    queryKey: ['platform_change_logs', platformId],
    enabled: !!platformId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_change_logs' as any)
        .select('*')
        .eq('client_platform_id', platformId!)
        .order('changed_at', { ascending: false });
      if (error) throw error;
      return ((data as any[]) ?? []).map((r: any): PlatformChangeLog => ({
        id: r.id,
        clientPlatformId: r.client_platform_id,
        field: r.field,
        oldValue: r.old_value,
        newValue: r.new_value,
        changedBy: r.changed_by,
        changedAt: r.changed_at,
      }));
    },
  });
}

export async function insertPlatformChangeLog(entry: {
  clientPlatformId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
}) {
  await supabase.from('platform_change_logs' as any).insert({
    client_platform_id: entry.clientPlatformId,
    field: entry.field,
    old_value: entry.oldValue,
    new_value: entry.newValue,
    changed_by: entry.changedBy,
  } as any);
}
