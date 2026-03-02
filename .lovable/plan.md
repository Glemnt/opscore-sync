

## Adicionar plataforma às demandas

### O que precisa ser feito

Adicionar um campo `platform` (texto, opcional) à tabela `tasks` no banco de dados, e expor esse campo nos formulários de criação e edição de demandas.

### Alterações

**1. Migration -- adicionar coluna `platform` à tabela `tasks`**
```sql
ALTER TABLE tasks ADD COLUMN platform text;
```

**2. `src/types/index.ts`** -- adicionar `platform?: string` à interface `Task`

**3. `src/types/database.ts`** -- no `mapDbTask`, mapear `row.platform` para `task.platform`

**4. `src/hooks/useTasksQuery.ts`**
- No `useAddTask`, enviar `platform` ao inserir
- No `useUpdateTask`, incluir `platform` no mapeamento de campos

**5. `src/components/AddTaskDialog.tsx`**
- Adicionar estado `platform`
- Adicionar um `Select` que carrega as plataformas via `usePlatformsQuery`
- Incluir `platform` no objeto da task ao submeter

**6. `src/components/TaskDetailModal.tsx`**
- Adicionar um card editável de "Plataforma" na grid de info cards (ao lado de Prioridade/Tempo)
- Select com as plataformas dinâmicas + opção vazia "Sem plataforma"
- Alterações salvam via `updateTask`

**7. `src/pages/TasksPage.tsx`** -- no `TaskCard`, exibir badge da plataforma (se presente) similar ao badge de tipo

