

## Plano: Usar fases da pipeline (client_statuses) nos templates de demandas

### Problema raiz
Os dois dialogs (`PhaseDemandConfigDialog` e `GenerateDemandsDialog`) usam `useTaskStatusesQuery` (statuses de tarefas: backlog, in_progress, etc.) para listar as fases disponíveis. Porém, o `phase` passado ao `GenerateDemandsDialog` vem da `client_platforms.phase`, que usa chaves de `client_statuses` (onboarding, implementacao, escala, performance). Isso causa o desalinhamento -- os templates são criados para "backlog" mas o dialog busca por "implementacao".

### Mudanças

**1. `src/components/PhaseDemandConfigDialog.tsx`**
- Substituir `useTaskStatusesQuery` por `useClientStatusesQuery` no seletor de fases
- Isso faz com que ao criar templates, as fases disponíveis sejam as da pipeline de clientes (onboarding, implementacao, escala, performance, etc.)

**2. `src/components/GenerateDemandsDialog.tsx`**
- Substituir `useTaskStatusesQuery` por `useClientStatusesQuery` para resolver o label da fase
- O `phaseLabel` passará a buscar na tabela correta, exibindo o nome correto da fase

**3. Migração de dados (opcional)**
- Os 11 templates inseridos anteriormente com fases "backlog/in_progress/waiting_client/done" ficarão órfãos. Deletar esses registros antigos via SQL para limpar a tabela.

### Resultado
- Ao configurar templates, o usuário verá as fases da pipeline (onboarding, implementacao, escala, performance)
- Ao gerar demandas de uma plataforma, os templates correspondentes à fase atual serão exibidos corretamente
- Todos os templates criados aparecerão na geração

