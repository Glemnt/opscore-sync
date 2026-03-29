

## Motivos de Atraso + Plano de Acao

### Resumo

Criar tabela de motivos de atraso configuravel, integrar dropdown nos modais de plataforma e tarefa, e criar nova pagina "Plano de Acao" com registro e acompanhamento de crises.

---

### 1. Migration — Duas novas tabelas

**`delay_reasons`:**
- `id uuid PK DEFAULT gen_random_uuid()`
- `label text NOT NULL`
- `is_active boolean NOT NULL DEFAULT true`
- `sort_order integer NOT NULL DEFAULT 0`
- `created_at timestamptz NOT NULL DEFAULT now()`

Seed com os 20 motivos listados no prompt.

**`action_plans`:**
- `id uuid PK DEFAULT gen_random_uuid()`
- `client_id uuid NOT NULL`
- `platform_id uuid` (nullable, FK -> client_platforms)
- `identified_at date NOT NULL DEFAULT CURRENT_DATE`
- `days_delayed integer NOT NULL DEFAULT 0`
- `issue_description text NOT NULL DEFAULT ''`
- `crisis_type text NOT NULL DEFAULT 'atraso_tarefa'`
- `root_cause text NOT NULL DEFAULT ''`
- `responsible_for_delay text NOT NULL DEFAULT ''`
- `action_plan_text text NOT NULL DEFAULT ''`
- `new_deadline date`
- `resolution_status text NOT NULL DEFAULT 'aberto'` (aberto, em_andamento, escalado_diretoria, resolvido)
- `manager_aware boolean NOT NULL DEFAULT false`
- `created_by text NOT NULL DEFAULT ''`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

RLS: authenticated full CRUD em ambas.

---

### 2. Hooks

**`useDelayReasonsQuery.ts`** (novo): query all active reasons sorted, add/update/delete mutations.

**`useActionPlansQuery.ts`** (novo): query all action plans (join client name), add/update/delete mutations.

---

### 3. Substituir MOTIVO_ATRASO_OPTIONS por dados do banco

Atualizar `PlatformDetailModal.tsx`: o select de motivo de atraso passa a usar dados de `useDelayReasonsQuery` em vez do array estatico em `platformUtils.ts`. Manter o array como fallback.

Atualizar `TaskDetailModal.tsx`: adicionar campo "Motivo de Atraso" (select) visivel quando tarefa esta atrasada ou com status bloqueado. Salvar no campo `comments` ou em novo campo — como a tabela `tasks` nao tem coluna `motivo_atraso`, adicionar coluna `motivo_atraso text DEFAULT ''` na migration.

---

### 4. Configuracoes — Secao "Motivos de Atraso"

Adicionar nova secao na `SettingsPage.tsx` (visivel apenas level 3): lista de motivos com toggle ativo/inativo, botao adicionar, botao excluir. Mesmo padrao visual das secoes de Plataformas e Tipos de Demanda ja existentes.

---

### 5. Nova pagina — `ActionPlansPage.tsx`

Tabela com colunas: Cliente, Data Identificacao, Dias Atraso, Problema, Tipo Crise (dropdown: Atraso de tarefa, Bloqueio externo, Erro interno, Risco de churn, Crise de comunicacao, Problema tecnico, Problema financeiro, Outro), Causa Raiz, Responsavel, Plano de Acao, Novo Prazo, Status Resolucao, Manager Ciente.

Filtros: Status resolucao, Tipo de crise, Responsavel.

Contadores: Total abertos, Em andamento, Escalados, Resolvidos.

Botao "Novo Plano de Acao" abre dialog com todos os campos. Edicao inline na tabela.

---

### 6. Navegacao

Adicionar "Plano de Acao" no `AppSidebar.tsx` (icone `AlertTriangle`), visivel para accessLevel >= 2 (Managers + Admins).

Adicionar case `'action-plans'` no `Index.tsx`.

---

### Arquivos

- `supabase/migrations/` — nova migration (2 tabelas + seed + coluna tasks.motivo_atraso)
- `src/hooks/useDelayReasonsQuery.ts` (novo)
- `src/hooks/useActionPlansQuery.ts` (novo)
- `src/pages/ActionPlansPage.tsx` (novo)
- `src/components/PlatformDetailModal.tsx` (usar delay_reasons do banco)
- `src/components/TaskDetailModal.tsx` (adicionar campo motivo_atraso)
- `src/pages/SettingsPage.tsx` (secao motivos de atraso)
- `src/components/AppSidebar.tsx` (nav item)
- `src/pages/Index.tsx` (route case)
- `src/lib/platformUtils.ts` (manter MOTIVO_ATRASO_OPTIONS como fallback)

### Ordem

1. Migration (tabelas + seed + coluna tasks)
2. Hooks (delay_reasons + action_plans)
3. SettingsPage (secao motivos)
4. PlatformDetailModal + TaskDetailModal (dropdown dinamico)
5. ActionPlansPage
6. Sidebar + rota

