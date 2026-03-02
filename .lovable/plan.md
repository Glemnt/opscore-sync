

## Aplicar Fluxo a uma Demanda Existente

### O que será feito
Adicionar um botão/select no modal de detalhes da demanda (`TaskDetailModal`) que permite ao usuário selecionar um fluxo existente e aplicá-lo como subtarefas da demanda. As etapas do fluxo serão adicionadas como subtarefas (sem substituir as existentes).

### Alterações

**1. `src/components/TaskDetailModal.tsx`**
- Importar `useFlowsQuery` (ou acessar `flows` via `useTasks`)
- Adicionar uma seção "Aplicar Fluxo" acima ou ao lado das subtarefas, com um `Select` listando os fluxos disponíveis
- Ao selecionar um fluxo, gerar novas subtarefas a partir das etapas (`steps`) do fluxo e adicioná-las às subtarefas existentes da demanda via `updateTask`
- Incluir ícone `Workflow` para identificação visual

### Comportamento
- O select mostra todos os fluxos cadastrados
- Ao selecionar, as etapas do fluxo são **adicionadas** às subtarefas existentes (não substituem)
- Se a demanda já tiver subtarefas, as novas são concatenadas ao final

