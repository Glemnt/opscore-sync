

## Separação Estrutural: Nível Cliente (Estratégico) vs Nível Plataforma (Operacional)

### Problema

Hoje o sistema trata o cliente como uma unidade monolítica. Quando um cliente tem múltiplas plataformas (Mercado Livre, Shopee, Shein), cada uma avança em ritmos diferentes, mas não há como registrar fase, responsável ou squad operacional por plataforma. Isso impede transferir apenas uma plataforma para outro squad sem mover o cliente inteiro.

### Solução

Criar uma tabela `client_platforms` que armazena dados operacionais por plataforma dentro de cada cliente. O cliente mantém seus dados estratégicos (mensalidade, contrato, saúde, fase macro). Cada plataforma tem sua própria fase, responsável, squad operacional, datas e pendências.

```text
┌─────────────────────────────────────────┐
│  CLIENTE (Estratégico)                  │
│  - Mensalidade, Contrato, Saúde        │
│  - Squad estratégico, Consultor         │
│  - Fase macro (derivada das plataformas)│
├─────────────────────────────────────────┤
│  PLATAFORMA 1: Mercado Livre            │
│    Fase: Performance | Squad: Águia     │
│    Responsável: Analista X              │
├─────────────────────────────────────────┤
│  PLATAFORMA 2: Shopee                   │
│    Fase: Implementação | Squad: Pantera │
│    Responsável: Analista Y              │
├─────────────────────────────────────────┤
│  PLATAFORMA 3: Shein                    │
│    Fase: Onboarding | Squad: Pantera    │
│    Responsável: —                       │
└─────────────────────────────────────────┘
```

---

### 1. Nova tabela `client_platforms` (migração)

```sql
CREATE TABLE public.client_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform_slug text NOT NULL,
  phase text NOT NULL DEFAULT 'onboarding',
  responsible text NOT NULL DEFAULT '',
  squad_id uuid REFERENCES public.squads(id) ON DELETE SET NULL,
  start_date date DEFAULT CURRENT_DATE,
  deadline date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, platform_slug)
);

ALTER TABLE public.client_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read client_platforms" ON public.client_platforms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert client_platforms" ON public.client_platforms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update client_platforms" ON public.client_platforms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete client_platforms" ON public.client_platforms FOR DELETE TO authenticated USING (true);
```

A coluna `phase` usará os mesmos status dinâmicos do `client_statuses` (Onboarding, Implementação, Performance, Escala, etc.).

---

### 2. Novo hook `useClientPlatformsQuery.ts`

- Query para buscar todos os registros de `client_platforms`
- Mutations: `useAddClientPlatform`, `useUpdateClientPlatform`, `useDeleteClientPlatform`
- Tipo mapeado `ClientPlatform` com campos: id, clientId, platformSlug, phase, responsible, squadId, startDate, deadline, notes

---

### 3. Atualizar `ClientDetailModal.tsx` — Aba "Plataformas"

Na seção onde hoje exibimos os badges simples de plataformas (linhas 287-303), substituir por uma seção expandida que mostra cada plataforma com:

- **Fase** (select com os status dinâmicos)
- **Squad operacional** (select com squads)
- **Responsável** (select com app_users)
- **Data de início** e **Prazo**
- Contagem de tarefas pendentes daquela plataforma
- Botão para editar/salvar inline cada plataforma

Ao adicionar uma nova plataforma ao cliente (no formulário de edição), criar automaticamente o registro em `client_platforms` com valores padrão.

---

### 4. Atualizar `ProjectsPage.tsx` — Kanban por plataforma no Squad

No painel de plataformas (Step 2.5, linhas 532-610), ao invés de mostrar apenas contagem de tarefas, exibir:

- **Fase** da plataforma (vinda de `client_platforms`)
- **Responsável operacional** da plataforma
- **Squad operacional** (quando diferente do squad do cliente)
- Badge visual indicando se a plataforma pode ser "transferida" (squad operacional ≠ squad atual)

---

### 5. Seed automático

Quando o sistema detectar que um cliente tem `platforms[]` mas não tem registros em `client_platforms`, oferecer criação automática dos registros com fase padrão "onboarding".

---

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Criar tabela `client_platforms` com RLS |
| `src/hooks/useClientPlatformsQuery.ts` | Novo hook para CRUD de `client_platforms` |
| `src/types/database.ts` | Adicionar tipo e mapper para `ClientPlatform` |
| `src/components/ClientDetailModal.tsx` | Substituir badges por painel operacional por plataforma |
| `src/pages/ProjectsPage.tsx` | Exibir dados operacionais da plataforma no Step 2.5 |

