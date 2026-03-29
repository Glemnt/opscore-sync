

## CS Dashboard — Painel do CS

### Resumo

Criar nova pagina `CsDashboardPage.tsx` com 5 secoes: agenda de entregaveis, painel de saude da carteira, kanban do CS, criacao de demandas para coordenador, e informacoes consolidadas por cliente. Filtro automatico pela carteira do CS logado (campo `cs_responsavel` nos clientes).

---

### 1. Nova pagina `src/pages/CsDashboardPage.tsx`

Pagina completa com 5 secoes em tabs ou scroll vertical. Usa hooks existentes: `useClientsQuery`, `useTasksQuery`, `useClientPlatformsQuery`, `useAppUsersQuery`. Filtra clientes por `cs_responsavel === currentUser.name`.

**Secao 1 — Agenda de Entregaveis:**
- Lista clientes da carteira ordenados por urgencia (tarefas atrasadas primeiro)
- Para cada cliente: tarefas pendentes em timeline com semaforo:
  - 🟢 No prazo (>2 dias) | 🟡 Atencao (<=2 dias) | 🔴 Atrasado | 🔵 Entregue (done)
- Checkbox "Comunicado ao cliente" (salva como chat note com tag `[CS-COMUNICADO]`)
- Filtro temporal: Hoje / Esta semana / Proxima semana

**Secao 2 — Painel de Saude:**
- Cards resumo: Total clientes | Em dia | Atencao | Criticos | Sem contato recente
- Critico = 3+ tarefas atrasadas OU health_color vermelho
- Sem contato = `ultimo_contato` > 3 dias ou null
- Lista com semaforo por cliente + dias sem contato + tarefas pendentes

**Secao 3 — Kanban do CS:**
- Kanban simplificado mostrando APENAS tarefas onde `responsible === currentUser.name`
- Usa as colunas do `task_statuses` existente
- Cards compactos com titulo, cliente, prazo, semaforo

**Secao 4 — Nova Demanda para Coordenador:**
- Dialog com campos: Cliente (select da carteira), Plataforma (filtrado), Descricao, Urgencia (P1-P4), Prazo
- Ao salvar, cria task com `responsible` = lider do squad do cliente, `origemTarefa` = 'manual', tipo = 'solicitacao_cs'
- Usa `useAddTask` existente

**Secao 5 — Info Consolidada por Cliente:**
- Accordion/collapsible por cliente
- Dados: contrato (mensalidade, tipo, duracao), plataformas + status, ultimo contato, NPS, ultimas 5 notas do chat
- Botao "Ver detalhes" abre `ClientDetailModal`

---

### 2. Sidebar + Rota

**`src/components/AppSidebar.tsx`:**
- Adicionar item `{ id: 'cs-dashboard', label: 'Painel CS', icon: Headset }` visivel quando `currentUser.role === 'cs'` ou `currentUser.role === 'gestao'` ou `accessLevel >= 2`

**`src/pages/Index.tsx`:**
- Importar `CsDashboardPage`
- Adicionar case `'cs-dashboard'` no switch com verificacao de role

---

### 3. Tabela `task_client_notifications` (nova — para checkbox "Comunicado ao cliente")

```sql
CREATE TABLE task_client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  notified_by text NOT NULL DEFAULT '',
  notified_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: authenticated full CRUD. Isso permite rastrear quais entregaveis foram comunicados ao cliente, separado do status da tarefa.

---

### Arquivos

- `supabase/migrations/` — CREATE TABLE task_client_notifications
- `src/pages/CsDashboardPage.tsx` (novo) — pagina completa com 5 secoes
- `src/components/AppSidebar.tsx` — novo nav item condicional
- `src/pages/Index.tsx` — nova rota

### Ordem

1. Migration (task_client_notifications)
2. CsDashboardPage (5 secoes)
3. Sidebar + rota

