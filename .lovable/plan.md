

## Plano: Trocar fases da pipeline no dialog de geração de demandas

### Problema
O seletor de fases no `GenerateDemandsDialog` está usando `useClientStatusesQuery` (fases de cliente: Onboarding, Pausado, etc.), mas o usuário quer ver as fases da pipeline de tarefas (Backlog, Em andamento, Aguard. cliente, Concluído) que vêm de `useTaskStatusesQuery`.

### Mudanças

**`src/components/GenerateDemandsDialog.tsx`**
- Substituir `useClientStatusesQuery` por `useTaskStatusesQuery` no import e na query
- Atualizar o `Select` e o `phaseLabel` para usar `taskStatuses` em vez de `clientStatuses`
- Ajustar referências: `clientStatuses` → `taskStatuses`

**`src/components/PhaseDemandConfigDialog.tsx`**
- Mesma troca: usar `useTaskStatusesQuery` em vez de `useClientStatusesQuery` para que os templates sejam criados com as fases corretas da pipeline de tarefas

### Resultado
O seletor mostrará "Backlog", "Em andamento", "Aguard. cliente", "Concluído" (e qualquer status customizado da pipeline de tarefas), alinhando templates e geração de demandas com a pipeline operacional.

