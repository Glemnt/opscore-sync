

## Persistir Tipos de Demanda Customizados

### Problema
Os tipos de demanda criados pelo usuário ficam apenas em estado local (`useState`) do `AddTaskDialog`, sendo perdidos ao fechar o dialog.

### Solução
Criar uma tabela `task_types` no banco de dados para persistir os tipos customizados, e um hook `useTaskTypesQuery` para carregar/adicionar tipos.

### Alterações

**1. Migração SQL — criar tabela `task_types`**
- Colunas: `id` (uuid), `key` (text, unique), `label` (text), `color` (text), `created_at`
- RLS: leitura e escrita para usuários autenticados
- Seed com os tipos padrão do `taskTypeConfig` para unificar tudo no banco

**2. Novo hook `src/hooks/useTaskTypesQuery.ts`**
- `useTaskTypesQuery()` — busca todos os tipos do banco
- `useAddTaskType()` — insere novo tipo customizado

**3. `src/components/AddTaskDialog.tsx`**
- Remover `customTypes` do estado local
- Usar `useTaskTypesQuery` para listar todos os tipos no Select
- `handleAddCustomType` passa a chamar `useAddTaskType` para persistir no banco
- Tipos ficam disponíveis em todas as sessões futuras

**4. `src/pages/TasksPage.tsx` e `src/components/TaskDetailModal.tsx`**
- Usar `useTaskTypesQuery` para exibir labels/cores corretas dos tipos customizados (fallback atual com `??` já funciona, mas ficará mais consistente)

