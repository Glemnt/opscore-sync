

## Dashboard Executivo — Reestruturação Completa

### Resumo

Reescrever `DashboardPage.tsx` com 5 blocos gerenciais, filtros globais no topo, dados 100% reais do banco, numeros clicaveis que abrem listas filtradas, e graficos interativos com Recharts. Acesso restrito por nivel: admin ve tudo, niveis 1-2 veem apenas seu squad.

---

### 1. Filtros Globais (topo)

Barra fixa no topo com filtros que afetam todos os blocos simultaneamente:
- Periodo: presets (Semana / Mes / Trimestre) + date range custom
- Squad (select multi usando `useSquadsQuery`)
- Responsavel (select filtrado por squad)
- Plataforma (select usando `usePlatformsQuery`)
- Fase (select: onboarding / implementacao / performance / escala)
- Saude (green / yellow / red / white)
- Prioridade (P1-P4)

Todos os dados (clients, client_platforms, tasks) sao filtrados por esses criterios antes de alimentar os blocos.

---

### 2. Bloco 1 — Operação Geral

StatCards em grid:
- Clientes ativos (excluindo churn)
- Em implementacao (sub: onboard + impl ativa, baseado em `fase_macro` ou `phase` dos clients)
- Em performance
- Em escala
- Inativos/churn
- Cada card com variacao vs semana anterior (calcula contagem na semana passada e compara)

Dados: `useClients` + `useClientStatusesQuery`

---

### 3. Bloco 2 — Plataformas

Dados: `useClientPlatformsQuery`
- Total plataformas ativas (phase != churn)
- Em onboard (phase === 'onboarding')
- Em implementacao
- Atrasadas (deadline < hoje e phase != performance/done) — clicavel, abre dialog com lista
- Prontas para performance (prontaPerformance === true)
- Grafico de pizza: distribuicao por `platform_slug` (count)

---

### 4. Bloco 3 — Atrasos (destaque vermelho)

Dados: `useTasksQuery` + `useClientPlatformsQuery` + `useDelayReasonsQuery`
- Total demandas atrasadas (deadline < hoje, status != done)
- Total plataformas atrasadas
- Clientes travados +3 dias (lista clicavel com nomes)
- Clientes travados +7 dias (lista clicavel com nomes)
- Plataformas travadas por falta de cliente (dependeCliente === true)
- Plataformas travadas por erro operacional (atrasadas e !dependeCliente)
- Grafico de barras horizontal: top 5 motivos de atraso (contagem de `motivo_atraso` nos tasks e client_platforms)

---

### 5. Bloco 4 — Equipe

Dados: `useTasksQuery` + `useAppUsersQuery` + `useSquadsQuery`
- Grafico de barras: demandas por colaborador (concluidas vs atrasadas)
- Passagens concluidas na semana por colaborador (tasks tipo passagem, done esta semana)
- Carga por colaborador com semaforo (verde <5, amarelo 5-8, vermelho >8 tarefas ativas)
- Taxa de avanco (% concluidas no prazo)
- Lista de sobrecarregados (>8 tarefas) com destaque vermelho

---

### 6. Bloco 5 — Receita e Carteira (visivel apenas admin, accessLevel === 3)

Dados: `useClients` + `useClientPlatformsQuery`
- MRR total
- Receita por plataforma (grafico de barras)
- Clientes adicionados no periodo (filtrado por date range)
- Churn no periodo
- Saude da carteira (grafico de rosca: saudavel/atencao/critico)
- Clientes em risco de churn (risco_churn !== 'baixo', lista clicavel)

---

### 7. Componente de Lista Clicavel

Dialog/Sheet reutilizavel que abre ao clicar em qualquer numero. Recebe titulo + lista de items (clientes ou plataformas) e exibe em tabela simples com nome, status, responsavel. Clique no item pode navegar ao detalhe.

---

### Arquivos

- `src/pages/DashboardPage.tsx` — reescrita completa

### Hooks existentes reutilizados (sem alteracao)
- `useClientsQuery` (via ClientsContext)
- `useClientPlatformsQuery`
- `useTasksQuery` (via TasksContext)
- `useAppUsersQuery`
- `useSquadsQuery`
- `usePlatformsQuery`
- `useClientStatusesQuery`
- `useDelayReasonsQuery`
- `useTaskTypesQuery`

### Ordem

1. Reescrever DashboardPage.tsx com filtros globais + 5 blocos + dialog de lista clicavel

