import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDbSquad, type DbSquad } from '@/types/database';
import type { Squad } from '@/types';

export function useSquadsQuery() {
  return useQuery({
    queryKey: ['squads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('squads').select('*');
      if (error) throw error;
      return (data as DbSquad[]).map(mapDbSquad);
    },
  });
}

export function useAddSquad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (squad: Squad) => {
      const { error } = await supabase.from('squads').insert({
        id: squad.id,
        name: squad.name,
        leader: squad.leader,
        members: squad.members,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['squads'] }),
  });
}

export function useUpdateSquad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Squad, 'id'>> }) => {
      const { error } = await supabase.from('squads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['squads'] }),
  });
}

export function useRemoveSquad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('squads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['squads'] }),
  });
}
