

## Auditoria de Regressao e Validacao Pos-Correcoes

---

### A. Resumo Executivo

**Veredito: PARCIALMENTE CORRIGIDO — riscos criticos permanecem**

Das correcoes planejadas na auditoria anterior, **apenas parte foi implementada**. A migracao de foreign keys adicionou apenas 1 FK (team_members_squad_id), nao as ~8 prometidas. As policies RLS de 4 tabelas continuam com role `{public}`. A visibilidade por squad nao foi implementada. O sistema esta marginalmente melhor, mas os 3 problemas mais criticos continuam abertos.

---

### B. Validacao das Correcoes Implementadas

| Correcao | Status | Evidencia |
|---|---|---|
| Squad edit/delete restrito a admin | OK | `ProjectsPage.tsx` L233: `currentUser?.accessLevel === 3 &&` |
| Remocao de signup publico | OK | `AuthContext.tsx` nao tem mais funcao `signup` |
| IDs UUID em AddTaskDialog | OK | `crypto.randomUUID()` em L133 e L147 |
| assignFlowToClient busca de clients | OK | `TasksContext.tsx` L80: `clients.find((c) => c.id === clientId)` |
| clientFlows populado do banco | OK | `TasksContext.tsx` L55-59: usa `useClientFlowsQuery` |
| Toast de erro em mutacoes (TasksContext) | OK | `onMutationError` com toast em todas mutacoes |
| FK team_members_squad_id | OK | Migracao aplicada |

---

### C. Correcoes NAO Implementadas (Ainda Abertas)

#### C1. RLS ainda com role `{public}` — CRITICO

**Tabelas afetadas:** `task_types`, `client_statuses`, `task_statuses`, `platforms`

A migracao para corrigir as policies nunca foi criada. Todas as 4 tabelas ainda permitem SELECT, INSERT, UPDATE e DELETE para usuarios anonimos (nao autenticados).

**Impacto:** Qualquer pessoa sem login pode ler e modificar tipos de tarefa, status de clientes, status de tarefas e plataformas via API direta.

**Gravidade:** CRITICA

**Fix:** Migration SQL para dropar policies existentes e recria-las com role `{authenticated}`.

---

#### C2. Foreign keys ausentes em tabelas criticas — ALTO

A migracao so adicionou `team_members.squad_id → squads.id`. Faltam:

- `subtasks.task_id → tasks.id ON DELETE CASCADE`
- `task_chat_notes.task_id → tasks.id ON DELETE CASCADE`
- `client_change_logs.client_id → clients.id ON DELETE CASCADE`
- `client_chat_notes.client_id → clients.id ON DELETE CASCADE`
- `platform_change_logs.client_platform_id → client_platforms.id ON DELETE CASCADE`
- `platform_chat_notes.client_platform_id → client_platforms.id ON DELETE CASCADE`
- `platform_documents.client_platform_id → client_platforms.id ON DELETE CASCADE`
- `project_checklist_items.project_id → projects.id ON DELETE CASCADE`
- `tasks.client_id → clients.id ON DELETE CASCADE`
- `projects.client_id → clients.id ON DELETE CASCADE`
- `client_platforms.client_id → clients.id ON DELETE CASCADE`
- `client_platforms.squad_id → squads.id ON DELETE SET NULL`
- `client_flows.client_id → clients.id ON DELETE CASCADE`
- `client_flows.flow_id → flows.id ON DELETE CASCADE`
- `clients.squad_id → squads.id ON DELETE SET NULL`

**Impacto:** Registros orfaos podem existir; deletar um cliente nao remove suas tarefas, logs, notas, etc.

**Gravidade:** ALTA

---

#### C3. Visibilidade por squad nao implementada — CRITICO

`ClientsContext.getVisibleClients()` (L97-100) continua retornando TODOS os clientes:

```tsx
const getVisibleClients = useCallback((): Client[] => {
  if (!currentUser) return [];
  return clients; // <-- sem filtro por squad
}, [currentUser, clients]);
```

Conforme a memoria `auth/global-access-policy`, todos os usuarios autenticados tem acesso total a funcionalidades operacionais. Portanto, este comportamento esta **intencional e correto** conforme a politica vigente.

**No entanto**, a memoria `features/squad-visibility-rules` diz que usuarios nao-admin devem ver apenas squads onde estao listados em `squadIds` ou sao `leader`. Estas duas memorias sao **contraditorias**.

**Gravidade:** MEDIA (depende de qual regra prevalece)

**Fix:** Clarificar com o usuario qual regra deve valer. Se a politica global prevalece, nenhuma mudanca necessaria. Se o isolamento por squad prevalece, implementar filtro.

---

#### C4. Dados financeiros expostos no payload — MEDIO

A query `useClientsQuery` faz `supabase.from('clients').select('*')`, retornando `monthly_revenue` e `setup_fee` para todos os usuarios autenticados. A UI esconde com `isAdmin`, mas os dados trafegam no payload.

O Dashboard ja protege visualmente:
- MRR so aparece se `isAdmin` (L217)
- Mas `clients` inclui os valores para calculos de churn, evolucao, etc.

**Gravidade:** MEDIA

**Fix:** Criar view sem colunas financeiras para nao-admins, ou aceitar que o payload expoe mas a UI protege (risco menor se todos sao colaboradores internos).

---

### D. Bugs e Riscos Adicionais Encontrados

#### D1. forwardRef warning nao corrigido — BAIXO

Console logs mostram warnings para `StatCard` e `StatusBadge` em `shared.tsx`. Sao funcoes simples sem `forwardRef`. Nao causa crash mas polui o console.

**Fix:** Envolver `StatCard` e `StatusBadge` com `React.forwardRef`.

---

#### D2. ProductivityPage usa dados estaticos de team_members — ALTO

`ProductivityPage` (L20-28) usa `completedTasks`, `lateTasks`, `onTimePct` diretamente da tabela `team_members`. Esses valores sao estaticos (default 0) e nunca sao calculados dinamicamente a partir de `tasks`.

O Dashboard (L95-103) ja calcula carga dinamicamente com `memberLoadMap`, mas a pagina de Produtividade nao.

**Impacto:** Metricas de produtividade completamente falsas/zeradas.

**Gravidade:** ALTA

**Fix:** Calcular metricas a partir da tabela `tasks`, filtrando por `responsible` e `status`.

---

#### D3. Contadores estaticos `active_projects`/`pending_tasks` — MEDIO

Tabela `clients` tem esses campos com default 0, nunca atualizados. Se usados em algum card ou relatorio, os numeros sao incorretos.

---

#### D4. Toast de erro ausente em ClientsContext — MEDIO

`ClientsContext` nao tem `onError` handlers nas mutacoes (`addClientMut`, `updateClientMut`, `deleteClientMut`). Apenas `TasksContext` foi corrigido.

**Fix:** Adicionar `onError` com toast nas mutacoes de clientes.

---

#### D5. client_flows query usa join sem FK — BAIXO

`useClientFlowsQuery` faz `select('id, client_id, flow_id, flows(name)')`. Sem FK entre `client_flows.flow_id` e `flows.id`, esse join depende de relacao implicita do PostgREST. Funciona hoje mas e fragil.

---

### E. Priorizacao

**Corrigir imediatamente:**
1. RLS de 4 tabelas: `task_types`, `client_statuses`, `task_statuses`, `platforms` — migration para trocar `{public}` por `{authenticated}` (C1)
2. Foreign keys ausentes — migration completa (C2)

**Corrigir em seguida:**
3. Toast de erro em ClientsContext (D4)
4. forwardRef warnings (D1)

**Melhoria importante:**
5. ProductivityPage com metricas reais (D2)
6. Contadores estaticos (D3)

**Decisao necessaria:**
7. Clarificar politica de visibilidade: global vs squad (C3)
8. Exposicao de dados financeiros no payload (C4)

---

### F. Plano de Correcao

**Migration 1 — RLS Fix:**
```sql
-- Drop e recria policies para task_types, client_statuses, task_statuses, platforms
-- Trocar TO public por TO authenticated em todas as operacoes
```

**Migration 2 — Foreign Keys:**
```sql
-- Adicionar ~15 FKs com ON DELETE CASCADE/SET NULL
-- Usar IF NOT EXISTS para idempotencia
```

**Codigo:**
- `ClientsContext.tsx`: adicionar `onError` handlers com toast
- `shared.tsx`: adicionar `React.forwardRef` em `StatCard` e `StatusBadge`
- `ProductivityPage.tsx`: calcular metricas a partir de `tasks` em vez de `team_members`

---

### G. Veredito Final

**Sistema: PARCIALMENTE CORRIGIDO — 2 vulnerabilidades criticas ainda abertas**

As correcoes de frontend (IDs, assignFlow, clientFlows, admin check, signup) foram bem implementadas. Porem, as correcoes de banco (RLS, FKs) ficaram incompletas. As 4 tabelas com RLS publica representam o risco mais urgente. A ausencia de FKs compromete integridade referencial. A pagina de Produtividade mostra dados falsos.

Recomendacao: executar as 2 migrations (RLS + FKs) como prioridade imediata, seguido dos ajustes de frontend.

