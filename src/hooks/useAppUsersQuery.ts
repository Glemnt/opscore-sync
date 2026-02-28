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
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // 2. Insert app_users row (admin RLS allows this)
      const { error: appError } = await supabase.from('app_users').insert({
        auth_user_id: authData.user.id,
        name: input.name,
        login: input.email,
        role: input.role,
        access_level: input.accessLevel,
        squad_ids: input.squadIds,
      });
      if (appError) throw appError;

      // 3. Insert user role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'user',
      });
      if (roleError) throw roleError;
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
