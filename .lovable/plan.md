

## Jornada do CS (D1-D90) — Modulo Completo

### Resumo

Criar duas tabelas no banco (`cs_journey_templates` e `cs_journey_items`), um hook de queries, uma secao de configuracao de templates em SettingsPage, uma secao "Jornada dos Clientes" no CsDashboardPage, e uma aba "Jornada CS" no ClientDetailModal. Ao cadastrar cliente, gerar automaticamente os 90 dias de jornada.

---

### 1. Migration — Duas tabelas novas

```sql
CREATE TABLE cs_journey_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  day_number integer NOT NULL,
  phase text NOT NULL DEFAULT 'onboard',
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cs_journey_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  template_id uuid,
  scheduled_date date NOT NULL,
  actual_date date,
  status text NOT NULL DEFAULT 'pendente',
  completed_by text NOT NULL DEFAULT '',
  completed_at timestamptz,
  notes text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  day_number integer NOT NULL DEFAULT 0,
  phase text NOT NULL DEFAULT 'onboard',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: authenticated full CRUD em ambas. Seed dos ~30 templates default (D1-D90 conforme especificado).

---

### 2. Hook `src/hooks/useCsJourneyQuery.ts` (novo)

- `useCsJourneyTemplatesQuery()` — lista templates ordenados por day_number
- `useAddJourneyTemplate()`, `useUpdateJourneyTemplate()`, `useDeleteJourneyTemplate()` — CRUD de templates
- `useCsJourneyItemsQuery(clientId?)` — lista items, opcionalmente filtrado por client_id
- `useUpdateJourneyItem()` — atualizar status, notes, link, actual_date
- `useGenerateJourneyForClient()` — mutation que gera items a partir dos templates ativos, calculando `scheduled_date = client.start_date + day_number dias uteis`

---

### 3. Geracao automatica ao cadastrar cliente

No `useAddClient` (useClientsQuery.ts), apos inserir o cliente com sucesso, chamar a funcao de geracao da jornada. Alternativa: disparar no `ClientsContext.addClient` callback `onSuccess`.

---

### 4. SettingsPage — Aba "Jornada CS"

Nova tab na pagina de configuracoes (acessivel apenas para admin):
- Tabela listando templates: Dia | Fase | Titulo | Ativo
- Botoes: Adicionar template, Editar, Excluir, Toggle ativo
- Fases disponiveis: onboard, primeiros_resultados, estabilizacao, consolidacao

---

### 5. CsDashboardPage — Secao "Jornada dos Clientes"

Nova tab no dashboard do CS:
- Tabela por cliente da carteira: Cliente | Dia atual (ex: "D23 de 90") | Barra de progresso | Proxima tarefa | Status
- Dia atual = dias uteis entre start_date e hoje
- Alertas: tarefas atrasadas (scheduled_date < hoje e status pendente)
- Clique em cliente expande timeline das tarefas da jornada
- Cada tarefa: marcar como feita, adicionar notas, link

---

### 6. ClientDetailModal — Aba "Jornada CS"

Nova tab no modal do cliente:
- Timeline vertical das tarefas da jornada organizada por fase
- Semaforo: verde (feita) | amarelo (hoje/proxima) | vermelho (atrasada) | cinza (pendente futura)
- Campos editaveis: status, notas, link

---

### Arquivos

- `supabase/migrations/` — CREATE TABLE cs_journey_templates + cs_journey_items + INSERT seed
- `src/hooks/useCsJourneyQuery.ts` (novo) — hooks completos
- `src/pages/SettingsPage.tsx` — nova tab "Jornada CS"
- `src/pages/CsDashboardPage.tsx` — nova tab "Jornada"
- `src/components/ClientDetailModal.tsx` — nova aba "Jornada CS"
- `src/hooks/useClientsQuery.ts` ou `src/contexts/ClientsContext.tsx` — trigger de geracao automatica

### Ordem

1. Migration (tabelas + seed)
2. Hook useCsJourneyQuery
3. SettingsPage (aba templates)
4. Geracao automatica no cadastro de cliente
5. CsDashboardPage (secao jornada)
6. ClientDetailModal (aba jornada)

