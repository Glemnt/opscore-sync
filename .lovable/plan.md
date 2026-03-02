

## Adicionar múltiplas plataformas em Demandas

### Problema
Atualmente a demanda aceita apenas uma plataforma (campo `platform` tipo `text`). O usuário quer selecionar múltiplas plataformas, igual ao comportamento já existente em Clientes.

### Alterações

**1. Migração no banco de dados**
- Alterar coluna `tasks.platform` de `text` para `text[]` (array), convertendo valores existentes para array de um elemento.

**2. `src/types/index.ts`**
- Mudar `platform?: string` para `platforms?: string[]` na interface `Task`.

**3. `src/types/database.ts`**
- Atualizar `mapDbTask` para mapear o campo array corretamente.

**4. `src/components/AddTaskDialog.tsx`**
- Trocar o `<Select>` de plataforma por botões toggle multi-select (mesmo padrão do `AddClientDialog`).
- Estado `platform` passa de `string` para `string[]`.

**5. `src/components/AddDemandDialog.tsx`**
- Mesmo ajuste: adicionar campo de plataformas multi-select se existir (verificar se já tem campo de plataforma — atualmente não tem, então adicionar).

**6. `src/components/TaskDetailModal.tsx`**
- Trocar o `<Select>` único por botões toggle multi-select para editar plataformas da demanda.

**7. `src/hooks/useTasksQuery.ts`**
- Atualizar `useAddTask` e `useUpdateTask` para enviar `platforms` como array ao banco.

**8. Demais referências**
- Ajustar qualquer leitura de `task.platform` no código (filtros, exibição) para usar `task.platforms` (array).

