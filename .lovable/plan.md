

## Correção: Dropdown de Responsável deve usar colaboradores de Configurações

### Problema
Os dropdowns de "Responsável" nas páginas de clientes (`AddClientDialog` e `ClientDetailModal`) estão puxando dados da tabela `team_members`. O correto é usar a tabela `app_users` — os colaboradores cadastrados na página de Configurações.

### Alterações

**1. `src/components/AddClientDialog.tsx`**
- Substituir `useTeamMembersQuery` por `useAppUsersQuery`
- Trocar `teamMembers.map(m => ...)` por `appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)`

**2. `src/components/ClientDetailModal.tsx`**
- Substituir `useTeamMembersQuery` por `useAppUsersQuery` (nos dois locais onde `teamMembers` é usado: no `EditableField` inline e no form de edição completa)
- Trocar `teamMembers.map(m => ...)` por `appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)`

Ambos os arquivos já importam hooks do mesmo padrão, então a mudança é direta.

