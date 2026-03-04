

## Plano: Reestruturar templates para serem baseados em fluxos

### Problema atual
O template de demanda por fase tem: título + owner (interna/cliente) + fluxo (opcional). Ao gerar, cria 1 tarefa por template. O usuário quer que cada **subtarefa do fluxo** vire uma demanda individual na pipeline.

### Novo comportamento

**PhaseDemandConfigDialog (Editar Templates):**
- Remover o campo "Título da demanda"
- Manter o seletor Interna/Cliente
- Tornar o seletor de Fluxo **obrigatório** (remover opção "Nenhum")
- O título do template será salvo automaticamente como o nome do fluxo selecionado
- Na listagem, mostrar o nome do fluxo como identificador principal

**GenerateDemandsDialog (Gerar Demandas):**
- Ao montar as rows, em vez de 1 row por template, **desmembrar**: para cada template com fluxo, criar 1 row por step do fluxo
- Cada row terá: título = nome da subtarefa do fluxo, owner do template, campos de responsável e prazo
- Ao criar, cada row vira uma tarefa independente na fase selecionada (sem subtarefas, pois cada step já é uma tarefa)
- O `flowId` será persistido em todas as tarefas geradas daquele fluxo

### Mudanças por arquivo

**`src/components/PhaseDemandConfigDialog.tsx`**
- Remover `Input` de título e estado `newTitle`
- Tornar fluxo obrigatório: remover `<SelectItem value="none">` e validar `newFlowId` no `handleAdd`
- Salvar `title` automaticamente como o nome do fluxo selecionado
- Na listagem, exibir nome do fluxo como identificador principal em vez do título

**`src/components/GenerateDemandsDialog.tsx`**
- Alterar a lógica de construção de `rows`: para cada template, buscar os steps do fluxo vinculado e criar 1 `DemandRow` por step
- Adicionar campo `flowId` em cada row expandida
- Na criação (`handleCreate`), criar 1 tarefa por row (sem subtarefas adicionais, cada step já é a tarefa)
- Manter responsável e prazo por row
- Atualizar contadores

### Resultado
Ao configurar um template, o usuário seleciona um fluxo obrigatoriamente. Ao gerar demandas, cada etapa do fluxo aparece como uma demanda individual que pode ter responsável e prazo próprios, e cada uma é criada como tarefa separada na fase da pipeline.

