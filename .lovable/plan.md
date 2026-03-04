

## Plano: Melhorar o fluxo de geração de demandas por fase

### Problema
1. Ao clicar em "Editar Templates" no `GenerateDemandsDialog`, o `PhaseDemandConfigDialog` abre sem a fase previamente selecionada -- o usuário precisa selecionar novamente.
2. Ao gerar demandas, não há campos de **responsável** e **prazo** -- as demandas são criadas com responsável vazio e prazo = hoje.
3. O fluxo vinculado ao template não é salvo como subtarefas na tarefa criada de forma que apareça no card da demanda (o fluxo já gera subtasks, mas o responsável e prazo ficam incorretos).

### Mudanças

**1. `PhaseDemandConfigDialog` -- receber fase inicial como prop**
- Adicionar prop `initialPhase?: string`
- Inicializar `selectedPhase` com `initialPhase` quando fornecido
- No `GenerateDemandsDialog`, passar `selectedPhase` como `initialPhase` ao abrir o config dialog

**2. `GenerateDemandsDialog` -- adicionar campos de responsável e prazo por demanda**
- Expandir a interface `DemandRow` com `responsible: string` e `deadline: string`
- Importar `useAppUsersQuery` para listar membros disponíveis
- Para cada row selecionada, adicionar um `Select` de responsável e um date picker (ou input date) de prazo
- Usar esses valores ao chamar `addTask.mutateAsync` em vez de `responsible: ''` e `deadline: hoje`

**3. Garantir que fluxo gere subtarefas corretamente**
- O código atual já cria subtasks a partir do `flowId` do template (linhas 111-119). Verificar que o `taskId` usado no insert de subtasks corresponde ao ID real da tarefa criada (atualmente usa `crypto.randomUUID()` antes do insert, e o mesmo ID é passado para subtasks -- está correto).

### Resultado
- Ao abrir "Editar Templates", a fase já vem selecionada automaticamente
- O usuário define responsável e prazo para cada demanda antes de criar
- A demanda criada terá responsável, prazo e subtarefas do fluxo visíveis no card

