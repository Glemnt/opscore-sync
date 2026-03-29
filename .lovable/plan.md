

## Reestruturar Kanban de Squads — Plataformas com Fases Macro

### Resumo

Expandir o Kanban de Squads para exibir ~25 colunas organizadas em 4 grupos colapsaveis (Implementacao, Performance, Escala, Auxiliares), enriquecer os cards com mais informacoes operacionais, e adicionar filtros de fase macro e dias em atraso.

---

### 1. Migration — Tabela `kanban_column_configs` + Seed de colunas

Criar tabela `kanban_column_configs`:
- `id uuid PK DEFAULT gen_random_uuid()`
- `key text NOT NULL UNIQUE`
- `label text NOT NULL`
- `group_key text NOT NULL` (implementacao, performance, escala, auxiliar)
- `group_label text NOT NULL`
- `sort_order integer NOT NULL DEFAULT 0`
- `is_active boolean NOT NULL DEFAULT true`
- `created_at timestamptz NOT NULL DEFAULT now()`

Seed com as 25 colunas especificadas, organizadas nos 4 grupos. RLS: authenticated full CRUD.

Tambem: DELETE dos registros atuais de `platform_phase_statuses` e INSERT das mesmas 25 colunas para manter compatibilidade com o Kanban existente que usa essa tabela.

---

### 2. Hook — `useKanbanColumnConfigsQuery.ts` (novo)

Query todas as colunas ativas ordenadas, agrupadas por `group_key`. Mutations para add/update/delete/reorder.

---

### 3. Cards expandidos

Adicionar ao card existente no Kanban:
- Badge de prioridade (P1 vermelho, P2 laranja, P3 amarelo, P4 cinza) — puxa de `client.prioridadeGeral`
- Dias em atraso (vermelho, visivel se > 0) — `computeDiasEmAtraso(cp.deadline)`
- Motivo do atraso (texto curto) — `cp.motivoAtraso`
- Prazo — `cp.deadline`
- Badges operacionais condicionais: seller/lojista, full/flex/turbo, depende_cliente, pronta_performance
- Cores de plataforma no badge: ML=verde, Shopee=laranja, Shein=roxo, TikTok=preto (mapa estatico)

---

### 4. Colunas agrupadas e colapsaveis

Renderizar as colunas do Kanban agrupadas por `group_key`. Cada grupo tem um header clicavel que colapsa/expande as colunas daquele grupo. Estado de collapse em `useState<Record<string, boolean>>`.

---

### 5. Novos filtros

Adicionar ao painel de filtros existente:
- **Fase macro** (Implementacao, Performance, Escala, Auxiliar) — filtra por grupo da coluna
- **Dias em atraso** (> 0, > 3, > 7) — filtra cards com `computeDiasEmAtraso > threshold`

---

### 6. Historico ao arrastar

Ao dropar um card em nova coluna, alem de atualizar `phase`, inserir registro em `platform_change_logs` com campo='phase', old/new values.

---

### Arquivos

- `supabase/migrations/` — nova migration (CREATE TABLE kanban_column_configs + seed + update platform_phase_statuses)
- `src/hooks/useKanbanColumnConfigsQuery.ts` (novo)
- `src/pages/ProjectsPage.tsx` — cards expandidos, colunas agrupadas/colapsaveis, novos filtros, log de historico no drop

### Ordem

1. Migration
2. Hook
3. ProjectsPage (colunas agrupadas + cards + filtros + historico)

