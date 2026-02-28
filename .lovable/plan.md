

## Problema

A `SettingsPage` usa `useAuth().users`, que é apenas um `useState([])` local — nunca busca dados do banco. O admin existe no banco (`admin@grupotg.com`), mas a lista `users` no contexto começa vazia e só cresce via `addUser` local (em memória).

## Solução

1. **Criar hook `useAppUsersQuery.ts`** — busca todos os registros de `app_users` via `useQuery`
2. **Atualizar `SettingsPage`** — usar o novo hook ao invés de `useAuth().users`; o formulário "Novo Usuário" deve usar `supabase.auth.signUp` + insert em `app_users` (como o signup faz), com mutation que invalida o cache
3. **Remover `users` e `addUser` do `AuthContext`** — não são mais necessários; o estado local nunca refletia o banco

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/hooks/useAppUsersQuery.ts` |
| Editar | `src/pages/SettingsPage.tsx` |
| Editar | `src/contexts/AuthContext.tsx` (remover `users`, `addUser`) |

### Detalhes técnicos

- O hook faz `supabase.from('app_users').select('*')` e mapeia com `mapDbAppUser`
- O formulário de novo usuário continuará chamando `supabase.auth.signUp` para criar o auth user e depois inserir em `app_users` com o `access_level` e `role` escolhidos no form (admin pode criar usuários com qualquer nível)
- A RLS de `app_users` para SELECT já permite leitura (`USING (true)`) para authenticated

