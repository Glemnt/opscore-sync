

## Filtro por tipo de demanda na página Demandas

### O que será feito
Adicionar um filtro por tipo de demanda (tags) no Kanban da página `TasksPage`, usando os tipos já existentes em `taskTypeConfig` (Anúncio, Copy, Design, etc.) + tipos customizados criados pelo usuário.

### Alteração

**`src/pages/TasksPage.tsx`**:
1. Adicionar estado `selectedType` (default `'all'`)
2. Coletar todos os tipos únicos das tasks visíveis (para incluir tipos customizados que não estão no `taskTypeConfig`)
3. Renderizar um `<select>` ao lado do filtro de responsável com as opções de tipo
4. Adicionar a condição `matchType` no filtro `filtered`

A UI será um dropdown similar ao de responsável, mostrando o label do tipo (usando `taskTypeConfig` quando disponível, ou o próprio valor como fallback para tipos customizados).

### Detalhes técnicos
- Não precisa de mudança no banco de dados — o campo `type` já existe na tabela `tasks`
- `taskTypeConfig` de `src/lib/config.ts` já mapeia os tipos padrão para labels/cores
- Tipos customizados (criados no `AddTaskDialog`) terão fallback para exibir o próprio valor como label

