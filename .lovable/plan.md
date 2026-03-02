

## Reordenar colunas do Kanban via drag-and-drop

### Problema
As colunas do Kanban (tanto em Demandas quanto em Projetos) não podem ser reordenadas. A ordem atual depende de `created_at` ou `label`, sem campo de posição.

### Alterações

**1. Migration SQL**
- Adicionar coluna `sort_order INTEGER NOT NULL DEFAULT 0` nas tabelas `task_statuses` e `client_statuses`
- Atualizar os registros existentes para ter `sort_order` sequencial baseado na ordem atual (`created_at` para task_statuses, `label` para client_statuses)

**2. Hooks de reordenação**
- `useTaskStatusesQuery.ts`: ordenar por `sort_order` em vez de `created_at`; adicionar mutation `useReorderTaskStatuses` que recebe array de `{key, sort_order}` e faz upsert em batch
- `useClientStatusesQuery.ts`: ordenar por `sort_order` em vez de `label`; adicionar mutation `useReorderClientStatuses`
- Ao criar nova coluna, definir `sort_order` como `max + 1`

**3. Drag-and-drop nas colunas do Kanban**
- `TasksPage.tsx`: adicionar `draggable` nos headers das colunas (separado do drag de cards), com `onDragStart`/`onDragOver`/`onDrop` que detectam se o item arrastado é uma coluna (via dataTransfer type diferente, ex: `column-key`) e reordenam localmente + persistem via mutation
- `ProjectsPage.tsx`: mesma lógica para as colunas de status de clientes
- Visual: indicador de drop entre colunas (linha vertical colorida) ao arrastar uma coluna

**4. Diferenciação drag de coluna vs drag de card**
- Cards usam `dataTransfer.setData('text/plain', taskId)` (já existente)
- Colunas usarão `dataTransfer.setData('column-key', statusKey)` para distinguir os dois tipos de drag

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | `ALTER TABLE task_statuses ADD sort_order`; `ALTER TABLE client_statuses ADD sort_order` |
| `useTaskStatusesQuery.ts` | Order by `sort_order`, add `useReorderTaskStatuses` |
| `useClientStatusesQuery.ts` | Order by `sort_order`, add `useReorderClientStatuses` |
| `TasksPage.tsx` | Column drag-and-drop + visual indicator |
| `ProjectsPage.tsx` | Column drag-and-drop + visual indicator |

