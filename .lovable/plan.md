

## Plano: Persistir o fluxo vinculado na demanda criada

### Problema
Quando uma demanda é gerada a partir de um template com fluxo, as subtarefas do fluxo são criadas corretamente, mas **a tarefa não armazena qual fluxo foi usado**. No `TaskDetailModal`, o seletor "Aplicar Fluxo" sempre mostra o placeholder vazio porque não existe um campo `flow_id` na tabela `tasks` nem no tipo `Task`.

### Mudanças

**1. Migração de banco -- adicionar coluna `flow_id` na tabela `tasks`**
- `ALTER TABLE public.tasks ADD COLUMN flow_id uuid REFERENCES public.flows(id) ON DELETE SET NULL DEFAULT NULL;`

**2. `src/types/index.ts` -- adicionar `flowId` ao tipo `Task`**
- Adicionar campo opcional `flowId?: string` na interface `Task`

**3. `src/types/database.ts` -- atualizar `mapDbTask`**
- Mapear `flow_id` -> `flowId` no mapeamento da task

**4. `src/hooks/useTasksQuery.ts` -- persistir `flowId`**
- No `useAddTask`, incluir `flow_id: task.flowId ?? null` no insert
- No `useUpdateTask`, adicionar `flowId: 'flow_id'` ao `keyMap`

**5. `src/components/GenerateDemandsDialog.tsx` -- passar `flowId` ao criar tarefa**
- Adicionar `flowId: row.flowId ?? undefined` na chamada `addTask.mutateAsync`

**6. `src/components/TaskDetailModal.tsx` -- mostrar o fluxo ativo**
- Em vez de `value=""`, usar `task.flowId ?? ""` como valor do select de "Aplicar Fluxo"
- Quando o usuário selecionar outro fluxo, atualizar o `flow_id` da tarefa além de inserir subtarefas

### Resultado
A demanda criada a partir de um template com fluxo terá o campo `flow_id` preenchido, e ao abrir a demanda o fluxo aparecerá selecionado/ativo no card.

