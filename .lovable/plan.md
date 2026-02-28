

## Plano: Etapa 2 — Hooks + Refatoração dos Contexts

### Problema com tipos gerados
O arquivo `types.ts` gerado automaticamente está vazio (sem tabelas). Vou criar tipos manuais para as rows do banco em um arquivo separado e usar casting nas queries do Supabase.

### Arquivos a criar

1. **`src/types/database.ts`** — Tipos manuais para as rows do banco (DbClient, DbTask, DbProject, DbSquad, etc.) e funções de mapeamento para os tipos existentes do app (`Client`, `Task`, etc.)

2. **`src/hooks/useClientsQuery.ts`** — Hook com `useQuery` para listar clients + change_logs + chat_notes, e `useMutation` para add/update/delete/addChatNote

3. **`src/hooks/useTasksQuery.ts`** — Hook com `useQuery` para tasks + subtasks + chat_notes, e `useMutation` para CRUD + flows + templates

4. **`src/hooks/useProjectsQuery.ts`** — Hook com `useQuery` para projects + checklist_items

5. **`src/hooks/useSquadsQuery.ts`** — Hook com `useQuery`/`useMutation` para squads

6. **`src/hooks/useTeamMembersQuery.ts`** — Hook para team_members

7. **`src/hooks/useFlowsQuery.ts`** — Hook para flows e custom_templates

### Arquivos a refatorar

8. **`src/contexts/AuthContext.tsx`** — Trocar login local por `supabase.auth.signInWithPassword`. Usar `onAuthStateChange` + `getSession`. Buscar `app_users` pelo `auth_user_id`. Manter `getVisibleClients` com base no `accessLevel` + `squadIds`.

9. **`src/contexts/ClientsContext.tsx`** — Substituir `useState(initialClients)` por `useClientsQuery()`. Todas as mutations passam pelo hook. Remover import de `mockData`.

10. **`src/contexts/TasksContext.tsx`** — Substituir `useState(initialTasks)` por `useTasksQuery()`. Flows e templates via hooks separados. Remover import de `mockData`.

11. **`src/contexts/SquadsContext.tsx`** — Substituir `useState(initialSquads)` por `useSquadsQuery()`. Remover import de `mockData`.

12. **`src/pages/LoginPage.tsx`** — Alterar form para usar `supabase.auth.signInWithPassword(email, password)`. Adicionar opção de signup. Adicionar reset de senha.

13. **`src/pages/Index.tsx`** — Usar `supabase.auth.onAuthStateChange` para controlar autenticação ao invés de `currentUser` do contexto local.

### Detalhes técnicos

- Como `types.ts` está vazio, todas as queries usarão `supabase.from('table_name').select('*')` com cast manual `as unknown as DbRow[]`
- Cada hook exporta `{ data, isLoading, error }` + mutations nomeadas
- Os contexts continuarão existindo como wrappers finos sobre os hooks, para manter a API de consumo nas páginas estável (evitar refatorar 15+ páginas nesta etapa)
- O campo `login` da tabela `app_users` será usado como email para autenticação
- Será necessário criar pelo menos 1 usuário auth real para testar (signup no form ou via seed)

### Ordem de implementação

1. Criar `types/database.ts` com tipos e mappers
2. Criar todos os hooks (5-6 arquivos)
3. Refatorar os 4 contexts
4. Atualizar LoginPage com auth real
5. Atualizar Index.tsx

