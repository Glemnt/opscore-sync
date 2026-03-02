

## Persistir colunas do Kanban de Demandas

### Problema
As colunas do Kanban na página de Demandas são apenas estado local -- ao recarregar a página, colunas customizadas são perdidas. Além disso, o campo `tasks.status` é um enum PostgreSQL fixo com 4 valores, impedindo status customizados.

### Alterações necessárias

**1. Migration SQL**
- Criar tabela `task_statuses` (igual ao modelo `client_statuses`: id, key, label, class_name, created_at) com RLS para usuários autenticados
- Inserir os 4 status padrão (backlog, in_progress, waiting_client, done)
- Alterar `tasks.status` de enum para `text` para aceitar status customizados

**2. Novo hook `src/hooks/useTaskStatusesQuery.ts`**
- Espelhar a estrutura de `useClientStatusesQuery.ts`
- Queries: `useTaskStatusesQuery`, `useTaskStatusesMap`, `useAddTaskStatus`, `useDeleteTaskStatus`, `useUpdateTaskStatus`

**3. Atualizar `src/types/index.ts`**
- Mudar `TaskStatus` para aceitar strings customizadas: `'backlog' | 'in_progress' | 'waiting_client' | 'done' | (string & {})`

**4. Atualizar `src/pages/TasksPage.tsx`**
- Carregar colunas do banco via `useTaskStatusesQuery` em vez de `defaultKanbanCols` local
- Botão "Nova Coluna" abre dialog pedindo nome, salva via `useAddTaskStatus`
- Adicionar botão de excluir coluna com confirmação via AlertDialog, remove via `useDeleteTaskStatus`
- Renomear coluna persiste via `useUpdateTaskStatus`
- Remover manipulação direta de `setCols` -- colunas derivam reativamente do banco

**5. Atualizar `src/hooks/useTasksQuery.ts`**
- Cast `status` como `any` no insert/update para compatibilidade com tipos gerados (mesmo padrão usado em `useClientsQuery`)

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | Criar `task_statuses`, seed defaults, `ALTER tasks.status TYPE text` |
| `src/hooks/useTaskStatusesQuery.ts` | Novo hook CRUD para status de tarefas |
| `src/types/index.ts` | `TaskStatus` aceitar `(string & {})` |
| `src/pages/TasksPage.tsx` | Colunas do banco + dialogs criar/excluir |
| `src/hooks/useTasksQuery.ts` | Cast `status as any` |

