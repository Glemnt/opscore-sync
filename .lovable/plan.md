

## Adicionar exclusão onde falta

### Levantamento de lacunas

Analisei todas as entidades que podem ser criadas ou editadas e identifiquei onde falta a opção de excluir:

| Entidade | Criar | Editar | Excluir | Onde |
|----------|-------|--------|---------|------|
| Tipos de Demanda (task_types) | ✅ AddTaskDialog | ❌ | ❌ | AddTaskDialog, SettingsPage |
| Status de Cliente (client_statuses) | ✅ ClientsPage | ❌ | ❌ | ClientsPage (filtros) |
| Plataformas | ✅ SettingsPage | ❌ | ✅ | SettingsPage |
| Status de Demanda (task_statuses) | ✅ TasksPage | ✅ rename | ✅ | TasksPage |
| Status de Cliente (client_statuses) | ✅ ProjectsPage | ✅ rename | ✅ | ProjectsPage Kanban |
| Squads | ✅ | ✅ | ✅ | ProjectsPage |
| Usuários | ✅ | ✅ | ✅ | SettingsPage |
| Fluxos | ✅ | ✅ | ✅ | FlowManagerDialog |

### Itens que precisam de exclusão

**1. Tipos de Demanda (task_types)** — Podem ser criados no AddTaskDialog mas não podem ser excluídos em lugar nenhum.

**2. Status de Cliente na ClientsPage** — Podem ser criados via botão "+" nos filtros mas não podem ser excluídos.

### Alterações planejadas

**`src/hooks/useTaskTypesQuery.ts`**
- Adicionar `useDeleteTaskType()` mutation (delete by id ou key)

**`src/pages/SettingsPage.tsx`**
- Adicionar nova seção "Tipos de Demanda" (similar à seção "Plataformas" existente) com chips mostrando cada tipo e botão de excluir (Trash2)
- Incluir input + botão para criar novos tipos

**`src/pages/ClientsPage.tsx`**
- Importar `useDeleteClientStatus` do hook existente
- Adicionar botão de excluir (X ou Trash2) ao lado de cada filtro de status (exceto "Todos")
- Adicionar AlertDialog de confirmação antes de excluir

### Detalhes técnicos

- `useDeleteTaskType` fará `DELETE FROM task_types WHERE id = $id`
- A seção de Tipos de Demanda em SettingsPage reutiliza o mesmo padrão visual da seção Plataformas (chips com Trash2)
- Na ClientsPage, o botão de excluir status aparece como um pequeno X ao lado do badge no filtro, visível ao hover

