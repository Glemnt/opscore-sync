

## Editar e Excluir Usuários na Página de Configurações

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `supabase/functions/create-user/index.ts` → renomear lógica para `manage-user` ou adicionar actions `update` e `delete` |
| Criar | `supabase/functions/manage-users/index.ts` — edge function com actions `update` e `delete` |
| Editar | `src/hooks/useAppUsersQuery.ts` — adicionar mutations `useUpdateAppUser` e `useDeleteAppUser` |
| Editar | `src/pages/SettingsPage.tsx` — adicionar botões de editar/excluir, dialog de edição, confirmação de exclusão |

### Implementação

**1. Edge function `manage-users`** (nova)
- Recebe `{ action, userId, ...data }`
- Valida que o chamador é admin (mesmo padrão do `create-user`)
- `action: "update"` → atualiza `app_users` (name, role, access_level, squad_ids) via service role
- `action: "delete"` → deleta o registro de `app_users`, `user_roles`, e chama `auth.admin.deleteUser()` para remover o auth user
- Impede que o admin exclua a si mesmo

**2. Hook mutations**
- `useUpdateAppUser`: invoca `manage-users` com action `update`, invalida cache
- `useDeleteAppUser`: invoca `manage-users` com action `delete`, invalida cache

**3. UI na SettingsPage**
- Coluna "Ações" na tabela com ícones de editar (Pencil) e excluir (Trash2)
- Dialog de edição reutilizando o mesmo formulário do "Novo Usuário" (nome, cargo, nível, squads), preenchido com dados atuais
- AlertDialog de confirmação antes de excluir
- Admin não pode excluir a si mesmo (botão desabilitado ou oculto)

### Detalhes técnicos
- A exclusão via `auth.admin.deleteUser()` requer service role (já disponível na edge function)
- RLS de `app_users` já permite ALL para admins via `has_role`
- O `auth_user_id` do `AppUserProfile` será usado para identificar o auth user a deletar

