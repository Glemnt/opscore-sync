

## Relatórios Gerenciais — Reestruturação Completa

### Resumo

Reescrever `ReportsPage.tsx` com 4 abas de relatórios (Operação, Equipe, Cliente, Executivo), cada uma com gráficos Recharts interativos, tabelas com dados reais, filtros independentes e exportação PDF/CSV. Atualizar `reportGenerators.ts` com novos geradores.

---

### 1. Estrutura da Página

Tabs no topo: **Operação** | **Equipe** | **Cliente** | **Executivo**

Cada aba tem:
- Barra de filtros: Período (presets + custom), Squad, Responsável, Plataforma, Cliente
- Gráficos + tabelas conforme especificação
- Botões "Exportar PDF" e "Exportar CSV" por seção

---

### 2. Aba Operação

- Clientes por fase: `BarChart` + tabela (dados de `useClients` agrupados por `faseMacro`)
- Plataformas por fase: `BarChart` + tabela (`useClientPlatformsQuery` agrupado por `phase`)
- Plataformas por consultor: tabela com contagem (`responsible`)
- Plataformas atrasadas por consultor: tabela alerta (deadline < hoje, phase != done)
- Top 10 motivos de atraso: `BarChart` horizontal (`motivoAtraso` de tasks + client_platforms)
- Tempo médio de onboarding/implementação/performance: calculado como diferença entre `startDate` e `dataRealPassagem`, agrupado por plataforma e consultor

---

### 3. Aba Equipe

- Tarefas por colaborador semana/mês: `BarChart` (tasks done filtradas por período)
- Tarefas atrasadas por colaborador: tabela alerta
- Passagens para performance por colaborador: tasks tipo passagem
- Produtividade semanal: `LineChart` (tasks concluídas por semana nas últimas 12 semanas)
- Gargalos: quem tem mais tasks com `depende_cliente || aguardando_cliente`
- Retrabalho: soma de `rejectionCount` por colaborador
- Nota média: média de `notaEntrega` por colaborador

---

### 4. Aba Cliente

- Seletor de cliente no topo
- Timeline do histórico (change_logs + tasks done + jornada CS)
- Plataformas do cliente com fases
- Tarefas abertas vs concluídas: `PieChart`
- Motivos de atraso: lista
- Evolução da saúde: `LineChart` (health_score ao longo do tempo — change_logs de health)
- Risco de churn: badge + indicadores

---

### 5. Aba Executivo (accessLevel >= 2)

- Backlog total / por squad / por plataforma: `BarChart`
- MRR por plataforma: `BarChart` (clients.monthlyRevenue cruzado com client_platforms)
- Churn rate mensal: contagem de clientes que entraram em churn no mês
- NPS consolidado: Score = % Promotores (9-10) - % Detratores (0-6) de `npsUltimo`
- Saúde da carteira: `PieChart` (distribuição green/yellow/red via `useHealthScores`)
- Clientes em risco de churn: tabela clicável

---

### 6. Exportação PDF

Atualizar `reportGenerators.ts` com novas funções:
- `generateOperationReport(filteredClients, filteredPlatforms, filteredTasks)`
- `generateTeamPerformanceReport(filteredTasks, appUsers)`
- `generateClientDetailedReport(client, tasks, platforms, changeLogs, journeyItems)`
- `generateExecutiveReport(clients, platforms, tasks, healthScores)`

Cada uma gera PDF A4 landscape com header Grupo TG, KPIs, tabelas e paginação.

---

### 7. Exportação CSV

Função utilitária `downloadCsv(headers, rows, filename)` que gera e baixa arquivo CSV. Botão ao lado de cada tabela.

---

### Hooks reutilizados (sem alteração)

- `useClients` (ClientsContext), `useTasksQuery` (TasksContext)
- `useClientPlatformsQuery`, `useAppUsersQuery`, `useSquadsQuery`
- `usePlatformsQuery`, `useHealthScores`, `useDelayReasonsQuery`
- `useCsJourneyQuery`

### Arquivos

- `src/pages/ReportsPage.tsx` — reescrita completa com 4 tabs
- `src/lib/reportGenerators.ts` — novos geradores PDF + CSV utility

### Ordem

1. ReportsPage.tsx (4 abas com gráficos e tabelas)
2. reportGenerators.ts (novos geradores + CSV)

