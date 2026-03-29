

## Health Score Automatico — Sistema de Saude Calculada

### Resumo

Adicionar colunas de health score na tabela `clients`, criar funcao utilitaria `calculateHealthScore` no frontend que recalcula em tempo real usando dados de tasks, client_platforms e campos do cliente. Aplicar visibilidade por role. Permitir override manual por admin com justificativa.

---

### 1. Migration — Novas colunas na tabela clients

```sql
ALTER TABLE clients
  ADD COLUMN health_score numeric DEFAULT NULL,
  ADD COLUMN health_calculated_at timestamptz DEFAULT NULL,
  ADD COLUMN health_override boolean NOT NULL DEFAULT false,
  ADD COLUMN health_override_reason text NOT NULL DEFAULT '';
```

A coluna `health_color` ja existe. Sera atualizada automaticamente pelo calculo.

---

### 2. Funcao utilitaria `src/lib/healthScore.ts` (novo)

Funcao pura `calculateHealthScore(client, clientTasks, clientPlatforms)` retorna `{ score: number, color: 'green'|'yellow'|'red'|'white', breakdown: {...} }`.

Componentes e pesos:
- **Tarefas atrasadas (25%)**: `(1 - min(atrasadas/total, 1)) * 100`
- **Plataformas travadas (20%)**: plataformas com status bloqueada ou aguardando_cliente vs total
- **Tempo sem resposta (15%)**: dias desde `ultimaRespostaCliente` — 0 dias=100, 7+=0
- **Prazo estourado (15%)**: `dataPrevistaPassagem < hoje` = 0, senao 100
- **Bloqueios ativos (10%)**: tasks com `depende_cliente || aguardando_cliente` vs total
- **Risco financeiro (10%)**: em_dia=100, atrasado=30, inadimplente=0
- **NPS (5%)**: `(npsUltimo / 10) * 100`, sem dado=50

Classificacao: 80-100=green, 50-79=yellow, 0-49=red, sem dados=white.

Funcao auxiliar `canViewHealth(user)`: retorna true se `accessLevel >= 2` ou `role === 'cs'`.

---

### 3. Hook `useHealthScores` (novo em `src/hooks/useHealthScores.ts`)

- Consome `useClients`, `useTasksQuery`, `useClientPlatformsQuery`
- Retorna mapa `clientId -> { score, color, breakdown }`
- Recalcula via `useMemo` a cada mudanca nos dados
- Mutation `useOverrideHealthScore(clientId, color, reason)` que faz update no clients + changelog

---

### 4. Integracao nos componentes existentes

**Card do cliente** (em `ClientsPage.tsx` e componentes de card):
- Substituir exibicao de `healthColor` manual pelo score calculado
- Condicional: so mostra se `canViewHealth(currentUser)`

**ClientDetailModal.tsx**:
- Nova secao "Saude" mostrando score numerico + breakdown dos 7 componentes
- Botao "Sobrescrever" (apenas admin) abre dialog com select de cor + campo de justificativa
- Badge indicando se health esta em override manual

**DashboardPage.tsx**:
- Bloco 5 (Saude da Carteira) usa scores calculados em vez de `healthColor` manual
- Drill-down de clientes criticos mostra breakdown

**CsDashboardPage.tsx**:
- Secao "Saude da Carteira" usa scores calculados

---

### 5. Cronologia do cliente (prova de valor)

No ClientDetailModal, ao clicar no score de saude, abre dialog/sheet com timeline consolidada:
- Reunioes da jornada CS (cs_journey_items com status feita)
- Tarefas concluidas (tasks com status done)
- Changelog do cliente (change_logs)
- Ordenado cronologicamente, com icones por tipo

---

### Arquivos

- `supabase/migrations/` — ALTER TABLE clients (4 colunas)
- `src/lib/healthScore.ts` (novo) — calculateHealthScore + canViewHealth
- `src/hooks/useHealthScores.ts` (novo) — hook com memo + override mutation
- `src/types/index.ts` — adicionar campos healthScore, healthOverride, healthOverrideReason ao Client
- `src/types/database.ts` — mapear novas colunas no mapDbClient
- `src/hooks/useClientsQuery.ts` — adicionar novas colunas no keyMap do update
- `src/components/ClientDetailModal.tsx` — secao saude + cronologia + override
- `src/pages/DashboardPage.tsx` — usar scores calculados
- `src/pages/CsDashboardPage.tsx` — usar scores calculados
- `src/pages/ClientsPage.tsx` — condicional de visibilidade nos cards

### Ordem

1. Migration (colunas)
2. healthScore.ts (logica pura)
3. useHealthScores.ts (hook)
4. Types + mappers
5. ClientDetailModal (saude + cronologia + override)
6. Dashboard + CsDashboard + ClientsPage (visibilidade)

