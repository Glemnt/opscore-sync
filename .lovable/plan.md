

## Timer Oculto + Produtividade com Dados Reais

### Resumo

Adicionar campos de timestamp na tabela `tasks`, criar tabela `task_pauses` para rastrear pausas, implementar timer automatico nas transicoes de status do Kanban, e reestruturar ProductivityPage com metricas reais detalhadas, ranking ponderado e filtros.

---

### 1. Migration

**Novos campos em `tasks`:**
```sql
ALTER TABLE tasks
  ADD COLUMN started_at timestamptz DEFAULT NULL,
  ADD COLUMN completed_at timestamptz DEFAULT NULL,
  ADD COLUMN tempo_real_minutos numeric DEFAULT NULL;
```

**Nova tabela `task_pauses`:**
```sql
CREATE TABLE task_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  pause_start timestamptz NOT NULL DEFAULT now(),
  pause_end timestamptz DEFAULT NULL,
  reason text NOT NULL DEFAULT 'outro',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE task_pauses ENABLE ROW LEVEL SECURITY;
-- authenticated full CRUD policies
```

---

### 2. Tipos e Mapeamento

**`src/types/index.ts`** — Adicionar a `Task`: `startedAt`, `completedAt`, `tempoRealMinutos`.

**`src/types/database.ts`** — Expandir `mapDbTask` com os 3 novos campos.

**`src/hooks/useTasksQuery.ts`** — Adicionar ao keyMap: `startedAt → started_at`, `completedAt → completed_at`, `tempoRealMinutos → tempo_real_minutos`. No insert tambem.

---

### 3. Hook `useTaskPausesQuery.ts` (novo)

- Query todas as pausas agrupadas por task_id
- Mutation para inserir pausa (pause_start) e finalizar pausa (update pause_end)
- Funcao utilitaria `calcTotalPauseMinutes(pauses)`: soma de todas as pausas finalizadas

---

### 4. Timer automatico no Kanban (`TasksPage.tsx`)

No `handleDrop`, adicionar logica baseada na transicao de status:

- **→ in_progress** (primeira vez): setar `startedAt = now()` se ainda nao tem. Finalizar qualquer pausa aberta.
- **→ waiting_client / bloqueada**: inserir nova pausa (pause_start = now, reason = status).
- **→ in_progress** (voltando de pausa): finalizar pausa aberta (pause_end = now).
- **→ aguardando_aprovacao / done**: setar `completedAt = now()`. Calcular `tempoRealMinutos = (completedAt - startedAt) - totalPausas` e salvar.

---

### 5. Reestruturar ProductivityPage

**Metricas por colaborador** (calculadas com `useMemo` a partir de tasks + pauses + client_platforms):
- Tarefas concluidas (semana/mes com filtro de periodo)
- Tarefas atrasadas, em andamento, carga atual
- Pontualidade (% entregue antes do deadline)
- Tempo medio de resolucao (media de `tempoRealMinutos`)
- Nota media de entrega (media de `notaEntrega` das tasks done)
- Taxa de retrabalho (`sum(rejectionCount) / total entregas`)
- Plataformas sob responsabilidade e atrasadas (via `useClientPlatformsQuery`)

**Ranking ponderado:**
```
score = concluidas*1 + noPrazo*2 + passagens*3 + destravadas*2 + reducaoAtraso*1 + notaMedia*2 + (1-retrabalho)*1
```

**Semaforos visuais:**
- Carga: verde <5, amarelo 5-8, vermelho >8
- Atraso: verde 0, amarelo 1-2, vermelho 3+

**Graficos:**
- Barras: desempenho por colaborador (concluidas + no prazo)
- Radar: habilidades comparativas (pontualidade, nota, retrabalho, velocidade)
- Linha: evolucao semanal (agrupar tasks por semana de conclusao)

**Filtros:**
- Periodo (semana/mes/custom)
- Squad
- Colaborador
- Plataforma

---

### Arquivos

- `supabase/migrations/` — nova migration (ALTER tasks + CREATE task_pauses)
- `src/types/index.ts` — expandir Task
- `src/types/database.ts` — expandir mapDbTask
- `src/hooks/useTasksQuery.ts` — novos campos no keyMap
- `src/hooks/useTaskPausesQuery.ts` (novo) — CRUD de pausas
- `src/pages/TasksPage.tsx` — logica de timer no handleDrop
- `src/pages/ProductivityPage.tsx` — reescrita completa com metricas reais

### Ordem

1. Migration
2. Types + database mapper
3. Hooks (tasks + pausas)
4. TasksPage (timer no handleDrop)
5. ProductivityPage (metricas + ranking + graficos + filtros)

