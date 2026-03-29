

## Capacidade da Equipe + Agendamento Automatico de Marcos

### Resumo

Adicionar coluna `max_capacity` na tabela `app_users`, criar tabela `scheduled_milestones` para marcos automaticos. Nova pagina `/capacidade` com painel de carga, simulador e calendario. Ao cadastrar cliente, gerar milestones automaticamente baseados na jornada CS.

---

### 1. Migration

```sql
-- Add max_capacity to app_users
ALTER TABLE public.app_users ADD COLUMN max_capacity integer NOT NULL DEFAULT 8;

-- Scheduled milestones table
CREATE TABLE public.scheduled_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  platform_id uuid,
  milestone_type text NOT NULL, -- reuniao_onboard, reuniao_implementacao, reuniao_entrega, checkpoint_30, checkpoint_60, checkpoint_90
  scheduled_date date NOT NULL,
  actual_date date,
  status text NOT NULL DEFAULT 'pendente', -- pendente, realizado, reagendado, cancelado
  responsible text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read scheduled_milestones" ON public.scheduled_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert scheduled_milestones" ON public.scheduled_milestones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update scheduled_milestones" ON public.scheduled_milestones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete scheduled_milestones" ON public.scheduled_milestones FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_milestones_client ON public.scheduled_milestones(client_id);
CREATE INDEX idx_milestones_date ON public.scheduled_milestones(scheduled_date);
CREATE INDEX idx_milestones_responsible ON public.scheduled_milestones(responsible);
```

---

### 2. Hook `useScheduledMilestonesQuery.ts` (novo)

- `useMilestonesQuery(filters?)` — busca milestones com filtros por responsavel, periodo, status
- `useAddMilestone()` — insercao
- `useUpdateMilestone()` — atualizar status, reagendar
- `useDeleteMilestone()`
- `generateMilestonesForClient(clientId, startDate, responsible)` — helper que cria os 6 marcos padrao calculando dias uteis

---

### 3. Atualizar `mapDbAppUser` e `AppUserProfile`

Adicionar campo `maxCapacity: number` ao `AppUserProfile` e ao mapper, usando `row.max_capacity`.

---

### 4. ClientsContext — Auto-gerar milestones ao cadastrar cliente

No `addClient` onSuccess, apos gerar jornada CS, chamar `generateMilestonesForClient` passando `client.id`, `client.startDate`, `client.responsible || client.csResponsavel`.

---

### 5. Nova pagina `CapacityPage.tsx` + rota `/capacidade`

**Visao por colaborador (tabela):**
- Nome, carga atual (tasks ativas count), capacidade max, % ocupacao, semaforo
- Carga projetada 7/15/30 dias (tasks com deadline no periodo)

**Visao de equipe (graficos):**
- `BarChart` horizontal: carga atual vs max por membro
- Projecao textual baseada em media de tasks por novo cliente

**Simulador:**
- Input numerico "Quantos clientes novos?"
- Calcula impacto: media de tasks por cliente * N, distribui por membro, mostra quem fica sobrecarregado

**Calendario de marcos:**
- Grid mensal mostrando milestones agendados por dia
- Densidade (contagem por dia) com cores
- Filtro por responsavel e periodo

---

### 6. Sidebar — adicionar link /capacidade

Adicionar item "Capacidade" no `AppSidebar.tsx`.

---

### 7. SettingsPage — campo max_capacity

No dialog de edicao de usuario, adicionar campo "Capacidade maxima" (number, default 8). Passar no update via edge function `manage-users`.

---

### Arquivos

- `supabase/migrations/` — ALTER app_users + CREATE scheduled_milestones
- `src/hooks/useScheduledMilestonesQuery.ts` (novo)
- `src/types/database.ts` — AppUserProfile + mapper com maxCapacity
- `src/contexts/ClientsContext.tsx` — auto-gerar milestones
- `src/pages/CapacityPage.tsx` (novo)
- `src/components/AppSidebar.tsx` — link capacidade
- `src/pages/SettingsPage.tsx` — campo max_capacity
- `src/App.tsx` ou `Index.tsx` — rota /capacidade
- `supabase/functions/manage-users/index.ts` — suportar max_capacity no update

### Ordem

1. Migration (app_users + scheduled_milestones)
2. Hook useScheduledMilestonesQuery
3. Types + mapper (maxCapacity)
4. manage-users edge function (max_capacity)
5. SettingsPage (campo capacidade)
6. ClientsContext (auto-gerar milestones)
7. CapacityPage + rota + sidebar

