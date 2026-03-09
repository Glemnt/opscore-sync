import { useQuery } from '@tanstack/react-query';
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

export function usePlatformChangeLogsQuery(clientPlatformId: string | undefined) {
  return useQuery({
    queryKey: ['platform_change_logs', clientPlatformId],
    enabled: !!clientPlatformId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_change_logs')
        .select('*')
        .eq('client_platform_id', clientPlatformId!)
        .order('changed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r): PlatformChangeLog => ({
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
