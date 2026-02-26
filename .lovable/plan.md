

## Plano: Relatórios PDF com Seleção por Categoria

### Dependências
- Instalar `jspdf` e `jspdf-autotable`

### Arquivos

**1. Criar `src/lib/reportGenerators.ts`**
Utilitário com 4 funções de geração de PDF, todas com header (logo Grupo TG + título + data), tabelas estilizadas com cores da marca (`#7c3aed`), paginação automática, formato A4 landscape.

- **`generateTeamReport(squads, clients, tasks, projects, teamMembers)`** — Relatório por Squad
  - Para cada squad: nome, líder, membros
  - Tabela de membros do squad: nome, cargo, tarefas concluídas, tempo médio, pontualidade, carga atual
  - Clientes do squad: nome, projetos ativos, demandas pendentes, receita
  - Tarefas do squad: título, tipo, status, responsável, prazo

- **`generateClientReport(client, tasks, projects)`** — Recebe 1 cliente selecionado
  - KPIs: receita, projetos ativos, demandas, saúde, contrato
  - Tabela de projetos: nome, tipo, status, progresso, prazo
  - Tabela de tarefas: título, responsável, tipo, status, prioridade, tempo estimado/real, prazo

- **`generateTaskTypeReport(taskType, tasks, taskTypeConfig)`** — Recebe 1 tipo de tarefa selecionado
  - KPIs: total de tarefas, concluídas, em andamento, tempo médio estimado, tempo médio real
  - Tabela completa: título, cliente, responsável, status, prioridade, tempo estimado/real, prazo

- **`generateCollaboratorReport(member, tasks, teamRoleConfig)`** — Recebe 1 colaborador selecionado
  - KPIs: tarefas concluídas, tempo médio, pontualidade, tarefas atrasadas, carga atual
  - Tabela de tarefas atribuídas: título, cliente, tipo, status, prioridade, prazo, tempo estimado/real

**2. Atualizar `src/pages/ReportsPage.tsx`**
- Cada card "Gerar relatório" abre um dialog/modal de seleção antes de gerar:
  - **Equipe**: gera direto (sem seleção) — relatório completo por squads
  - **Cliente**: Select com lista de clientes ativos → seleciona → gera PDF
  - **Tipo de Tarefa**: Select com tipos de tarefa → seleciona → gera PDF
  - **Colaborador**: Select com lista de membros → seleciona → gera PDF
- Usar `Dialog` + `Select` existentes do projeto
- Estado de loading no botão durante geração
- Toast de sucesso após download

### Resumo

| Arquivo | Alteração |
|---|---|
| `src/lib/reportGenerators.ts` | Novo — 4 funções de geração PDF |
| `src/pages/ReportsPage.tsx` | Dialogs de seleção + chamadas aos geradores |

