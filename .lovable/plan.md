

## Expandir client_platforms como Unidade Operacional Central

### Resumo

Adicionar campos operacionais a `client_platforms`, criar tabela de checklist por plataforma do cliente, expandir o `PlatformDetailModal` com checklist interativo e seção de passagem para performance, e calcular automaticamente a `faseMacro` do cliente.

---

### 1. Migration — Novos campos e tabela de checklist

**Novas colunas em `client_platforms`:**
- `platform_status text DEFAULT 'nao_iniciada'` (nao_iniciada, onboard, implementacao_ativa, aguardando_cliente, bloqueada, pronta_performance, em_performance, escalada, pausada, cancelada)
- `motivo_atraso text DEFAULT ''`
- `prazo_interno date DEFAULT NULL`
- `data_prevista_passagem date DEFAULT NULL`
- `data_real_passagem date DEFAULT NULL`
- `depende_cliente boolean DEFAULT false`
- `pronta_performance boolean DEFAULT false`
- `quem_aprovou_passagem text DEFAULT ''`
- `observacao_passagem text DEFAULT ''`
- `pendencias_remanescentes text DEFAULT ''`

**Nova tabela `client_platform_checklist`:**
- `id uuid PK DEFAULT gen_random_uuid()`
- `client_platform_id uuid NOT NULL` (FK -> client_platforms ON DELETE CASCADE)
- `catalog_item_id text NOT NULL` — referência ao id do item no JSONB do catálogo
- `label text NOT NULL`
- `etapa text DEFAULT ''`
- `bloqueia_passagem boolean DEFAULT false`
- `done boolean DEFAULT false`
- `checked_by text DEFAULT ''`
- `checked_at timestamptz DEFAULT NULL`
- `sort_order integer DEFAULT 0`
- `created_at timestamptz DEFAULT now()`

RLS: authenticated full CRUD em ambas.

---

### 2. Hook — `useClientPlatformChecklistQuery.ts` (novo)

CRUD: query por `client_platform_id`, toggle item (update done/checked_by/checked_at), seed checklist a partir do `platform_catalog`.

---

### 3. Expandir `ClientPlatform` interface e hook

Adicionar os novos campos ao `ClientPlatform` interface e ao `mapRow`/`keyMap` no `useClientPlatformsQuery.ts`.

---

### 4. PlatformDetailModal — Novas seções

**Checklist da plataforma:**
- Puxa itens de `client_platform_checklist` para o `client_platform_id`
- Se vazio, botão "Inicializar Checklist" copia do `platform_catalog`
- Cada item: checkbox, label, etapa badge, quem marcou, quando
- Barra de progresso (% concluído)
- Itens que `bloqueia_passagem=true` destacados em vermelho se não feitos

**Seção de Passagem para Performance:**
- Visível quando fase é implementação
- Mostra requisitos: checklist obrigatórios completos + sem tarefas bloqueadoras
- Botão "Marcar como Pronta para Performance" (habilitado quando requisitos atendidos)
- Campos: data prevista, data real, quem aprovou, observação, pendências

**Campos operacionais editáveis:**
- `platform_status` (select)
- `motivo_atraso` (select com opções padrão)
- `depende_cliente` (switch)
- `prazo_interno` (date picker)
- Dias em atraso (calculado: hoje - deadline, se > 0)

---

### 5. ClientDetailModal — Cards de plataforma expandidos

Atualizar `PlatformOperationalPanel` para exibir em cada card:
- Status da plataforma (badge colorido)
- Barra de progresso do checklist
- Dias em atraso (vermelho se > 0)
- Flag `depende_cliente` / `pronta_performance`
- Indicadores agregados no topo: plataformas prontas, atrasadas, passaram na semana

---

### 6. Cálculo automático da faseMacro do cliente

Criar função utilitária `computeClientFaseMacro(platforms: ClientPlatform[]): FaseMacro` que aplica as regras:
- Todas em onboard/implementacao_ativa → `implementacao`
- Todas em em_performance/escalada → `performance`
- Todas escaladas → `escala`
- Todas pausadas/canceladas → `pausado`/`cancelado`
- Mix → fase da plataforma mais atrasada

Chamar esta função ao salvar mudanças de `platform_status` e atualizar `clients.fase_macro` automaticamente.

---

### Arquivos

- `supabase/migrations/` — nova migration
- `src/hooks/useClientPlatformChecklistQuery.ts` (novo)
- `src/hooks/useClientPlatformsQuery.ts` (expandir interface + keyMap)
- `src/components/PlatformDetailModal.tsx` (checklist, passagem, campos operacionais)
- `src/components/ClientDetailModal.tsx` (cards expandidos, indicadores)
- `src/lib/platformUtils.ts` (novo — computeClientFaseMacro)

### Ordem

1. Migration
2. Checklist hook
3. ClientPlatform interface/hook
4. platformUtils
5. PlatformDetailModal
6. ClientDetailModal cards

