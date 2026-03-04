

## Plano: Usar status da pipeline no template de demandas por fase

### Problema atual
O `PhaseDemandConfigDialog` usa fases fixas (Onboarding, Implementação, Performance, Escala). O usuário quer que as opções sejam os status da pipeline do Kanban (vindos da tabela `task_statuses`) e que as demandas geradas entrem na coluna correta da pipeline.

### Mudanças

**1. `src/components/PhaseDemandConfigDialog.tsx`**
- Remover o array `PHASES` hardcoded
- Importar `useTaskStatusesQuery` para buscar os status da pipeline do banco
- Usar esses status como opções do dropdown de fase
- Inicializar `selectedPhase` com o primeiro status disponível

**2. `src/components/GenerateDemandsDialog.tsx`**
- Na criação das tarefas (`handleCreate`), usar `status: phase` em vez de `status: 'backlog'`, para que a demanda entre na coluna da pipeline correspondente à fase selecionada
- Atualizar o `phaseLabels` para usar os labels dinâmicos dos `task_statuses` (importar o hook `useTaskStatusesQuery`)

### Nenhuma mudança de banco de dados
A tabela `phase_demand_templates.phase` já aceita texto livre, então basta salvar a key do status da pipeline.

