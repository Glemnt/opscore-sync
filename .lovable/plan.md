

## Unificar criação de demandas na página Squads com a página Demandas

### Problema
A página Squads (ProjectsPage) usa o componente `AddDemandDialog` para criar demandas, que é mais simples e não inclui: tipo de demanda (com persistência no banco), tempo estimado, observações, e auto-geração de título. A página Demandas usa `AddTaskDialog`, que tem todos esses campos. A edição já usa o mesmo `TaskDetailModal` em ambas as páginas.

### Alterações

**`src/pages/ProjectsPage.tsx`**

1. Substituir `AddDemandDialog` por `AddTaskDialog` nos dois locais onde é usado:
   - No nível do projeto (linha ~416): remover o `AddDemandDialog` e usar `AddTaskDialog` com `defaultStatus="backlog"`
   - No `KanbanView` (linha ~615): substituir `AddDemandDialog` por `AddTaskDialog` com `defaultStatus` dinâmico baseado na coluna

2. O `AddTaskDialog` já pré-seleciona o cliente automaticamente pelo dropdown, então o usuário terá a mesma experiência da página Demandas, incluindo:
   - Seletor de tipo de demanda com opção de criar novos tipos (persistidos no banco)
   - Campo de tempo estimado
   - Campo de observações
   - Seletor de plataformas
   - Subtarefas
   - Responsável filtrado por squad do cliente

3. Remover imports de `AddDemandDialog` que não serão mais necessários.

### Resultado
A criação de demandas dentro de Squads → Cliente → Projeto terá exatamente a mesma interface e funcionalidade da página Demandas.

