

## Coordinator Dashboard — Painel do Coordenador

### Resumo

Criar nova pagina `CoordinatorDashboardPage.tsx` com 5 secoes focadas na operacao: feed de aprovacoes, controle de anuncios, resumo por colaborador, notas de qualidade e demandas do CS. Filtra automaticamente pelo squad do coordenador logado.

---

### 1. Nova pagina `src/pages/CoordinatorDashboardPage.tsx`

Usa hooks existentes: `useTasksQuery`, `useAppUsersQuery`, `useSquadsQuery`, `useClientPlatformsQuery`, `useTaskPausesQuery`. Filtra pelo squad do coordenador via `squads.filter(s => s.leader === currentUser.name)` para obter os membros.

**Secao 1 — Feed de Entregas (Aprovacao):**
- Query tasks com `status === 'aguardando_aprovacao'` filtradas pelos membros do squad
- Card por entrega: titulo, cliente, plataforma, analista, tempo decorrido (`tempoRealMinutos`), link/print de entrega
- Botoes Aprovar (nota 0-10) e Reprovar (motivo) usando `useUpdateTask`
- Badge "NOVO" animado (pulse) para entregas das ultimas 2 horas
- Ordenadas por mais recentes primeiro

**Secao 2 — Controle de Anuncios:**
- Tabela por colaborador do squad
- Colunas: Colaborador | Contas atribuidas (count client_platforms) | Meta (24/dia default) | Feitos (tasks done tipo anuncio) | Faltam | % | Status semaforo
- Meta configuravel via estado local (default 24/dia, 75/plataforma)
- Semaforo: verde 100% | amarelo 50-99% | vermelho <50%

**Secao 3 — Resumo por Colaborador:**
- Tabela: Colaborador | Status | Contas | Meta | Feitos | Faltam | % | Dias estimados | Urgentes | Alerta
- Alerta automatico vermelho para <50% com texto "Critico: X% feito"
- Calculo de dias restantes baseado em velocidade media (feitos / dias trabalhados)

**Secao 4 — Notas por Analista:**
- Grafico de barras (recharts) com nota media por analista
- Tabela: analista | nota media | total entregas | reprovacoes | taxa retrabalho
- Flag vermelho para analistas abaixo da media geral

**Secao 5 — Demandas do CS:**
- Filtro de tasks com `origemTarefa === 'manual'` e `type === 'solicitacao_cs'` direcionadas ao squad
- Mini-kanban ou lista com status: Pendente (backlog) | Em analise (in_progress) | Resolvido (done)
- Filtros: urgencia (priority P1-P4), plataforma

---

### 2. Sidebar + Rota

**`src/components/AppSidebar.tsx`:**
- Adicionar item `{ id: 'coordenador-dashboard', label: 'Painel Coordenador', icon: Shield }` na secao "Gestao" (accessLevel >= 2)

**`src/pages/Index.tsx`:**
- Importar `CoordinatorDashboardPage`
- Adicionar case `'coordenador-dashboard'` no switch com verificacao accessLevel >= 2

---

### Arquivos

- `src/pages/CoordinatorDashboardPage.tsx` (novo) — pagina completa com 5 secoes
- `src/components/AppSidebar.tsx` — novo nav item
- `src/pages/Index.tsx` — nova rota

### Ordem

1. CoordinatorDashboardPage (5 secoes com recharts)
2. Sidebar + rota

