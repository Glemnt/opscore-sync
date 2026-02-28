import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDbTeamMember, type DbTeamMember } from '@/types/database';

export function useTeamMembersQuery() {
  return useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('*');
      if (error) throw error;
      return (data as DbTeamMember[]).map(mapDbTeamMember);
    },
  });
}
