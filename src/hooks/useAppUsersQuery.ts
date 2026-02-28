import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDbAppUser } from '@/types/database';
import type { AppUserProfile } from '@/types/database';
import type { AccessLevel, TeamRole } from '@/types';
import { toast } from 'sonner';

export function useAppUsersQuery() {
  return useQuery({
    queryKey: ['app_users'],
    queryFn: async (): Promise<AppUserProfile[]> => {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapDbAppUser);
    },
  });
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: TeamRole;
  accessLevel: AccessLevel;
  squadIds: string[];
}

export function useCreateAppUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role,
          accessLevel: input.accessLevel,
          squadIds: input.squadIds,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_users'] });
      toast.success('Usuário criado com sucesso');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao criar usuário: ${err.message}`);
    },
  });
}
