

## Checklist Onboarding — Nova Tela de Esteira D1-D15

### Resumo

Criar uma nova pagina "Checklist Onboarding" com grid horizontal mostrando clientes em onboarding como linhas e tarefas D1-D15 como colunas. Cada celula e clicavel para alternar status. Semaforo automatico baseado em prazos.

---

### 1. Migration — Tabela `onboarding_checklist_items`

```sql
CREATE TABLE onboarding_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  task_key text NOT NULL,
  status text NOT NULL DEFAULT 'pendente', -- feito, pendente, atrasado, nao_aplica
  completed_by text DEFAULT '',
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, task_key)
);
```

RLS: authenticated full CRUD.

---

### 2. Hook — `useOnboardingChecklistQuery.ts`

- Query: busca todos os items, agrupados por `client_id`
- Mutation `upsertItem`: upsert por `(client_id, task_key)` — alterna status ciclicamente (pendente → feito → atrasado → nao_aplica → pendente), registra `completed_by` e `completed_at`

---

### 3. Pagina — `OnboardingChecklistPage.tsx`

**Contadores no topo:** Total no checklist, Em onboarding (≤20 dias), Carteira base (>20 dias), Ativos, Churn, Risco — computados dos clientes filtrados.

**Filtros:** CS Responsavel, Status geral (semaforo), Perfil cliente, Periodo de entrada.

**Grid com scroll horizontal:**
- Colunas fixas a esquerda: ID, Nome, CS, Perfil, Data Entrada, Prazo D15, Prazo D20, Semaforo Geral
- Colunas D1-D3 (9 tarefas): Reuniao Onboarding, Link Gravacao, Duracao, Briefing, Acessos, Cronograma, Impressora Termica, Modelo Anuncio, Equipe Definida
- Colunas D2-D3 (3 tarefas): Kit Entregue, Video 1, Reuniao Implementacao
- Colunas D3-D9 Auxiliar (8 tarefas): 3/7/11/15/22/25+ Anuncios, Termometro, Logistica
- Colunas D4-D9 Assistente (5 tarefas): Termometro, Promocoes, Envio, Campanha, Emissor
- Colunas Entrega (2 tarefas): Reuniao Entrega, NPS

**Cada celula:** Icone colorido (✅🟢/❌🔴/⚠️🟡/—⚫). Click cicla o status via upsert.

**Semaforo automatico:** Para cada tarefa, calcula o dia util esperado a partir da `start_date` do cliente. Se o dia ja passou e status != 'feito', exibe indicador vermelho. Se faltam ≤2 dias, amarelo. Se feito, azul. Caso contrario, verde.

**Prazo D15/D20:** Calculados como start_date + 15/20 dias uteis (funcao utilitaria que pula fins de semana).

---

### 4. Definicao das task_keys

Array constante com ~27 tarefas, cada uma com: `key`, `label`, `group` (d1d3_cs, d2d3_trans, d3d9_aux, d4d9_asst, entrega), `expectedDay` (numero 1-15 para calculo do semaforo).

---

### 5. Navegacao

- Adicionar "Checklist Onboarding" no `AppSidebar.tsx` (icone `ClipboardCheck`), visivel para todos
- Adicionar case `'onboarding-checklist'` no `Index.tsx`

---

### 6. Funcao utilitaria — dias uteis

`addBusinessDays(date, days)`: soma N dias uteis (pula sabado/domingo). Usada para calcular prazos D15 e D20 e o semaforo de cada tarefa.

---

### Arquivos

- `supabase/migrations/` — nova migration
- `src/hooks/useOnboardingChecklistQuery.ts` (novo)
- `src/pages/OnboardingChecklistPage.tsx` (novo)
- `src/components/AppSidebar.tsx` (add nav item)
- `src/pages/Index.tsx` (add route case)

### Ordem

1. Migration
2. Hook
3. Constantes de tarefas + utilitario dias uteis
4. Pagina com grid
5. Sidebar + rota

