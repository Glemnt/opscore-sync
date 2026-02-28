

## Tornar campos editáveis no modal de detalhes da demanda

### Situação atual
O `TaskDetailModal` exibe a maioria dos campos como texto estático (prazo, prioridade, tipo, tempo estimado, tempo real, título). Apenas o responsável e subtasks são editáveis.

### Alterações

**`src/components/TaskDetailModal.tsx`**:

1. **Título** -- Tornar editável inline (input que aparece ao clicar, ou um input com estilo discreto que salva no blur/Enter)

2. **Prazo** -- Substituir o texto estático por um `<Input type="date">` que chama `updateTask` ao mudar

3. **Prioridade** -- Substituir o badge estático por um `<Select>` com as 3 opções (Alta, Média, Baixa) usando `priorityConfig`

4. **Tipo de demanda** -- Substituir o badge estático por um `<Select>` com os tipos de `taskTypeConfig`

5. **Tempo estimado / Tempo real** -- Adicionar inputs numéricos editáveis para ambos os campos, permitindo atualizar `estimatedTime` e `realTime`

6. **Responsável** -- Atualizar para usar `useAppUsersQuery` (como já feito no `AddTaskDialog`) em vez de `squad.members`

Cada campo chamará `updateTask(task.id, { campo: novoValor })` ao ser alterado, salvando imediatamente no banco.

### Detalhes técnicos
- O `useUpdateTask` já suporta atualizar qualquer campo da task via o `keyMap` existente
- Não precisa de mudança no banco de dados
- Importar `useAppUsersQuery` para o dropdown de responsável (consistência com AddTaskDialog)

