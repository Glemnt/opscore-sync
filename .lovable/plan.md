

## Ativar botão "Adicionar" dentro das colunas do Kanban

### Problema
O botão "Adicionar" dentro de cada coluna do Kanban não tem `onClick` — é apenas visual.

### Solução
Fazer o botão abrir o dialog `AddTaskDialog` já com o status da coluna pré-selecionado, para que a demanda seja criada diretamente naquela coluna.

### Alterações

**`src/components/AddTaskDialog.tsx`**:
- Adicionar prop opcional `defaultStatus?: TaskStatus` (default `'backlog'`)
- Usar `defaultStatus` no `handleSubmit` ao criar o `newTask` em vez de `'backlog'` fixo

**`src/pages/TasksPage.tsx`**:
- Adicionar estado `addToStatus` para rastrear em qual coluna o botão foi clicado
- No botão "Adicionar" de cada coluna, adicionar `onClick` que seta `addToStatus` para o status da coluna e abre o dialog
- Passar `defaultStatus={addToStatus}` para `AddTaskDialog`
- Resetar `addToStatus` quando o dialog fechar

