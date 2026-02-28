

## Correção: Signup deslogando o admin

### Problema
`useCreateAppUser` usa `supabase.auth.signUp()` que automaticamente faz login como o novo usuário, substituindo a sessão do admin.

### Solução
Criar uma **edge function** `create-user` que usa o `supabase-admin` (service role) para criar o usuário via `admin.createUser()`, sem afetar a sessão do admin logado.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/functions/create-user/index.ts` |
| Editar | `src/hooks/useAppUsersQuery.ts` |

### Implementação

1. **Edge function `create-user`**:
   - Recebe `{ name, email, password, role, accessLevel, squadIds }`
   - Valida que o chamador é admin via `has_role`
   - Usa `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`
   - Insere em `app_users` e `user_roles` com service role
   - Retorna o usuário criado

2. **Atualizar `useCreateAppUser`**:
   - Trocar `supabase.auth.signUp` por chamada à edge function via `supabase.functions.invoke('create-user', { body })`
   - A sessão do admin permanece intacta

