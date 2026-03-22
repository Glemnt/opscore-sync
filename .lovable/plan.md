

## Corrigir ProductivityPage — usar app_users em vez de team_members

### Problema
A `ProductivityPage` usa `useTeamMembersQuery()` (tabela `team_members`) para obter a lista de membros. Embora as metricas ja sejam calculadas dinamicamente a partir de `tasks`, a **fonte da lista de pessoas** e a tabela errada — `team_members` tem campos estaticos (`completed_tasks`, `late_tasks`, etc.) e nao reflete os usuarios reais cadastrados em `app_users`.

### Correcao

**`src/pages/ProductivityPage.tsx`**:
- Trocar `useTeamMembersQuery` por `useAppUsersQuery`
- Adaptar o `useMemo` para usar `AppUserProfile` em vez de `TeamMember` (campos: `id`, `name`, `role`)
- A logica de calculo dinamico (completed, late, onTimePct, currentLoad) permanece identica — ja filtra `tasks` por `t.responsible === m.name`
- O ranking e graficos continuam funcionando sem mudanca visual

### Detalhes tecnicos

O tipo `AppUserProfile` ja tem `name` e `role` (ambos `TeamRole`), que sao os unicos campos usados do membro base. Os campos `completedTasks`, `lateTasks`, `onTimePct`, `currentLoad` ja sao calculados no `useMemo` e sobrescrevem os do objeto original via spread (`...m`).

Mudanca minima: apenas o import e a query source mudam. Nenhuma alteracao de schema ou migracao necessaria.

