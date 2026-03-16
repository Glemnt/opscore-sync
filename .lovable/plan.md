

## Plano: Corrigir criação e edição de demandas na página Squads

### Problemas encontrados

Dois bugs estruturais em `src/hooks/useTasksQuery.ts`:

**Bug 1 — Criação falha com subtarefas:**
Em `useAddTask` (linha 34), o ID da task é recalculado como UUID quando o original (`t_12345`) não é UUID. Porém na linha 59, os subtasks referenciam `task.id` (o ID original `t_...`), não o `taskId` recalculado. Isso causa falha na inserção de subtasks (tipo UUID inválido e referência a task inexistente).

**Bug 2 — Edição de subtarefas e notas não persiste:**
Em `useUpdateTask` (linha 83), os campos `subtasks` e `chatNotes` são explicitamente ignorados (`continue`). Quando o usuário marca/desmarca uma subtarefa ou adiciona uma nota no `TaskDetailModal`, a chamada `updateTask(task.id, { subtasks: updated })` não faz nada no banco — a alteração aparece localmente mas se perde ao recarregar.

### Correções em `src/hooks/useTasksQuery.ts`

**1. Corrigir `useAddTask`:**
- Usar `taskId` (o UUID recalculado) em vez de `task.id` para o `task_id` dos subtasks
- Garantir que os IDs dos subtasks também sejam UUIDs válidos

**2. Corrigir `useUpdateTask`:**
- Quando `updates.subtasks` estiver presente: fazer upsert/delete dos subtasks na tabela `subtasks`
- Quando `updates.chatNotes` estiver presente: inserir novas notas na tabela `task_chat_notes`

### Arquivo alterado

`src/hooks/useTasksQuery.ts`

