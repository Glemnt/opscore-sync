

## Timeline de Eventos — Cronologia Completa do Cliente

### Resumo

Criar tabela `timeline_events` no banco, hook `useTimelineQuery`, e integrar visualizacao de timeline no ClientDetailModal (aba "Timeline") e PlatformDetailModal (timeline filtrada). Eventos sao registrados automaticamente nos pontos de mutacao existentes (contexts e hooks).

---

### 1. Migration — Tabela `timeline_events`

```sql
CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  platform_id uuid,
  task_id uuid,
  event_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  old_value text,
  new_value text,
  triggered_by text NOT NULL DEFAULT 'Sistema',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read timeline_events" ON public.timeline_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert timeline_events" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_timeline_client ON public.timeline_events(client_id);
CREATE INDEX idx_timeline_platform ON public.timeline_events(platform_id);
CREATE INDEX idx_timeline_created ON public.timeline_events(created_at DESC);
```

Event types: `client_created`, `contract_started`, `platform_added`, `platform_removed`, `client_phase_changed`, `platform_phase_changed`, `platform_status_changed`, `responsible_changed`, `task_created`, `task_completed`, `task_rejected`, `task_overdue`, `client_contact`, `client_no_response`, `block_registered`, `platform_to_performance`, `platform_to_scale`, `client_paused`, `client_churn`, `health_score_changed`, `nps_registered`, `action_plan_created`, `journey_meeting`, `general_change`.

---

### 2. Hook `src/hooks/useTimelineQuery.ts` (novo)

- `useTimelineEventsQuery(clientId)` — busca eventos do cliente ordenados por `created_at DESC`
- `useTimelineByPlatform(platformId)` — filtra por platform_id
- `useAddTimelineEvent()` — mutation para inserir evento
- Funcao helper `logTimelineEvent(supabase, { clientId, platformId?, taskId?, eventType, description, oldValue?, newValue?, triggeredBy })`

---

### 3. Inserir eventos automaticamente nos pontos de mutacao

**ClientsContext.tsx** — `addClient`: log `client_created`; `updateClient`: para campos chave (phase, status, responsible, faseMacro), log eventos especificos como `client_phase_changed`, `client_paused`, `client_churn`, `responsible_changed`.

**useClientPlatformsQuery.ts** — `useAddClientPlatform`: log `platform_added`; `useDeleteClientPlatform`: log `platform_removed`; `useUpdateClientPlatform`: detectar mudancas em `phase` (log `platform_phase_changed`, `platform_to_performance`, `platform_to_scale`), `platform_status` (log `platform_status_changed`), `responsible` (log `responsible_changed`).

**TasksContext.tsx** — `addTask`: log `task_created`; `updateTask`: detectar status mudando para `done` (log `task_completed`), status para `rejected` ou `rejectionCount` incrementado (log `task_rejected`).

**useHealthScores.ts** — `useOverrideHealthScore`: log `health_score_changed`.

**useCsJourneyQuery.ts** — `useUpdateJourneyItem`: quando status muda para `feita`, log `journey_meeting`.

**useActionPlansQuery.ts** — ao criar plano, log `action_plan_created`.

Cada log usa `supabase.from('timeline_events').insert(...)` diretamente no `onSuccess` ou dentro da mutationFn, passando `currentUser?.name` como `triggered_by`.

---

### 4. ClientDetailModal — Aba "Timeline"

Nova aba ao lado das existentes. Exibe feed cronologico reverso com:
- Icone colorido por tipo (azul=criacao, verde=conclusao, vermelho=alerta/rejeicao, amarelo=mudanca, roxo=health)
- Data/hora formatada
- Tipo (label legivel) + descricao
- Quem realizou
- Filtros no topo: tipo de evento (select multi), periodo, plataforma

---

### 5. PlatformDetailModal — Secao Timeline

Nova aba/secao mostrando `useTimelineByPlatform(clientPlatform.id)` com o mesmo formato visual do ClientDetailModal, sem filtro de plataforma.

---

### Arquivos

- `supabase/migrations/` — CREATE TABLE timeline_events
- `src/hooks/useTimelineQuery.ts` (novo)
- `src/contexts/ClientsContext.tsx` — adicionar logs de timeline
- `src/hooks/useClientPlatformsQuery.ts` — adicionar logs de timeline
- `src/contexts/TasksContext.tsx` — adicionar logs de timeline
- `src/hooks/useHealthScores.ts` — adicionar log
- `src/hooks/useCsJourneyQuery.ts` — adicionar log
- `src/hooks/useActionPlansQuery.ts` — adicionar log
- `src/components/ClientDetailModal.tsx` — nova aba Timeline
- `src/components/PlatformDetailModal.tsx` — nova secao Timeline

### Ordem

1. Migration
2. useTimelineQuery.ts (hook + helper)
3. Instrumentar mutacoes (ClientsContext, TasksContext, useClientPlatformsQuery, useHealthScores, useCsJourneyQuery, useActionPlansQuery)
4. ClientDetailModal (aba Timeline)
5. PlatformDetailModal (secao Timeline)

