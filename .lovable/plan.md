

## Metas por Colaborador + Modulo NPS Funcional

### Resumo

Criar tabela `user_goals` para metas editaveis por colaborador, tabela `nps_responses` para NPS real substituindo mock. Integrar metas na Produtividade com barras de progresso e semaforo. Substituir ClientAIAnalysis mock por NPS funcional. Adicionar NPS consolidado no Dashboard.

---

### 1. Migration — Duas novas tabelas

```sql
CREATE TABLE public.user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL DEFAULT 'weekly',
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  meta_passagens integer NOT NULL DEFAULT 5,
  meta_destravamentos integer NOT NULL DEFAULT 3,
  meta_reducao_backlog integer NOT NULL DEFAULT 5,
  meta_anuncios_dia integer NOT NULL DEFAULT 24,
  meta_anuncios_cliente integer NOT NULL DEFAULT 75,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period, period_start)
);

CREATE TABLE public.nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  sent_at date NOT NULL DEFAULT CURRENT_DATE,
  responded_at date,
  score integer,
  category text, -- auto: promotor/neutro/detrator
  liked_most text NOT NULL DEFAULT '',
  improve text NOT NULL DEFAULT '',
  would_recommend boolean,
  manager_notified boolean NOT NULL DEFAULT false,
  action_plan text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: authenticated can CRUD both tables.

---

### 2. Hook `useUserGoalsQuery.ts` (novo)

- `useUserGoalsQuery(userId?)` — busca metas
- `useUpsertUserGoal()` — mutation para criar/atualizar meta
- Helper para buscar meta ativa do periodo atual

### 3. Hook `useNpsResponsesQuery.ts` (novo)

- `useNpsResponsesQuery(clientId?)` — busca respostas NPS
- `useAddNpsResponse()` — mutation para registrar NPS
- `useUpdateNpsResponse()` — para marcar manager_notified, action_plan
- Calculo automatico de `category` baseado no score

---

### 4. SettingsPage.tsx — Secao Metas no dialog de edicao de usuario

Ao editar um usuario, nova secao "Metas" com campos numericos editaveis:
- Meta semanal de passagens (default 5)
- Meta diaria de destravamentos (default 3)
- Meta reducao backlog (default 5)
- Meta anuncios/dia (default 24)
- Meta anuncios/cliente (default 75)

Mostra tambem dados automaticos (readonly): plataformas sob responsabilidade, plataformas em atraso.

---

### 5. ProductivityPage.tsx — Progresso vs Meta

Para cada colaborador, buscar meta ativa via `useUserGoalsQuery`. Exibir:
- Barra de progresso: "3/5 passagens esta semana"
- Semaforo: verde (>=100%), amarelo (>=60%), vermelho (<60%)
- Indicadores para cada meta definida

---

### 6. ClientAIAnalysis.tsx — Substituir mock por NPS funcional

Remover `mockAnalysisData`. Novo layout:
- Formulario para registrar NPS (score 0-10, campos texto)
- Historico de NPS do cliente (lista cronologica)
- Categoria calculada automaticamente (0-6=Detrator, 7-8=Neutro, 9-10=Promotor)
- Alerta visual para notas 0-6 (Manager precisa acionar em 24h)
- Sugestao de indicacao para notas 9-10
- Botao "Manager acionou" + campo plano de acao

Manter secoes de resumo do projeto e proximos passos como estao, alimentadas pelo health score e tasks.

---

### 7. DashboardPage.tsx — NPS Consolidado

Adicionar card de NPS no bloco executivo:
- Score = %Promotores - %Detratores
- Gauge visual com o score
- Drill-down com lista de respostas

---

### Arquivos

- `supabase/migrations/` — CREATE TABLE user_goals + nps_responses
- `src/hooks/useUserGoalsQuery.ts` (novo)
- `src/hooks/useNpsResponsesQuery.ts` (novo)
- `src/pages/SettingsPage.tsx` — secao metas no dialog de usuario
- `src/pages/ProductivityPage.tsx` — barras de progresso vs meta
- `src/components/ClientAIAnalysis.tsx` — reescrita com NPS funcional
- `src/pages/DashboardPage.tsx` — card NPS consolidado

### Ordem

1. Migration (2 tabelas)
2. useUserGoalsQuery + useNpsResponsesQuery (hooks)
3. SettingsPage (metas)
4. ProductivityPage (progresso vs meta)
5. ClientAIAnalysis (NPS funcional)
6. DashboardPage (NPS consolidado)

