

## Auditoria Completa do Sistema — OpsCore Sync

---

### A. Resumo Executivo

O sistema esta **parcialmente estavel** com fragilidades relevantes. Funciona para o fluxo principal (admin, operacao basica), mas possui vulnerabilidades de seguranca significativas, bugs latentes de renderizacao, inconsistencias de modelagem, e gaps de UX que impactam a confiabilidade operacional.

**Nivel de risco: MEDIO-ALTO** — o sistema funciona no dia a dia, mas possui problemas que podem causar crashes, perda de dados de formulario, e exposicao indevida de informacoes.

---

### B. Problemas Encontrados

#### CATEGORIA 1: SEGURANCA E PERMISSOES (CRITICO)

**1.1 — Visibilidade de dados nao filtrada por squad/perfil**
- **Onde:** `ClientsContext.getVisibleClients()` (linha 97-100) retorna TODOS os clientes para qualquer usuario autenticado
- **Causa:** A funcao ignora `squadIds` e `accessLevel` do usuario
- **Impacto:** Usuarios operacionais veem clientes de todos os squads, violando a regra de visibilidade por squad documentada na memoria do projeto
- **Gravidade:** CRITICA
- **Fix:** Filtrar clientes por `currentUser.squadIds` para niveis 1 e 2; manter acesso total so para nivel 3

**1.2 — Botoes de editar/excluir squad visiveis para todos**
- **Onde:** `ProjectsPage.tsx` linha 233: `{true &&` (hardcoded)
- **Causa:** A condicao que deveria ser `isAdmin` foi substituida por `true`
- **Impacto:** Qualquer usuario pode editar ou excluir squads
- **Gravidade:** ALTA
- **Fix:** Substituir `{true &&` por `{currentUser?.accessLevel === 3 &&`

**1.3 — RLS permissiva demais em varias tabelas**
- **Onde:** `task_types`, `client_statuses`, `task_statuses`, `platforms` — policies usam role `{public}` em vez de `{authenticated}`
- **Impacto:** Usuarios nao autenticados (anon) podem ler, inserir, atualizar e DELETAR registros dessas tabelas
- **Gravidade:** CRITICA
- **Fix:** Alterar policies para `{authenticated}` em todas essas tabelas

**1.4 — Signup publico ainda existe no AuthContext**
- **Onde:** `AuthContext.tsx` — funcao `signup` disponivel
- **Causa:** Embora a LoginPage nao tenha botao de signup, a funcao existe e cria usuario + user_role sem validacao admin
- **Impacto:** Se alguem chamar a API diretamente, pode criar contas
- **Gravidade:** MEDIA (mitigado pela ausencia de UI)
- **Fix:** Remover funcao `signup` do AuthContext; criacao de usuarios deve ser exclusivamente via edge function `create-user`

**1.5 — Dados financeiros (monthlyRevenue, setupFee) acessiveis a todos**
- **Onde:** A tabela `clients` tem `monthly_revenue` e `setup_fee` sem restricao por coluna
- **Impacto:** Usuarios operacionais podem ver dados financeiros via DevTools/network, mesmo que a UI oculte
- **Gravidade:** MEDIA
- **Fix:** Considerar view com security_invoker que exclui colunas financeiras para nao-admins

---

#### CATEGORIA 2: BANCO DE DADOS E MODELAGEM

**2.1 — Campo `responsible` duplicado: client vs client_platforms**
- **Onde:** Tabela `clients` tem `responsible` (legado) e `client_platforms` tem `responsible` (fonte de verdade)
- **Impacto:** Confusao sobre qual campo usar; filtragem pode consultar fonte errada
- **Gravidade:** MEDIA
- **Fix:** Memoria do projeto ja diz que client.responsible foi removido, mas o campo ainda existe na tabela e no tipo TypeScript. Remover do frontend ou depreciar formalmente

**2.2 — Foreign keys ausentes em tabelas criticas**
- **Onde:** NENHUMA tabela tem foreign keys definidas (todas mostram "no foreign keys")
- **Impacto:** `tasks.client_id`, `subtasks.task_id`, `client_platforms.client_id` etc nao tem integridade referencial; registros orfaos podem existir
- **Gravidade:** ALTA
- **Fix:** Adicionar FKs com `ON DELETE CASCADE` para subtasks, task_chat_notes, client_change_logs, client_chat_notes, platform_change_logs, platform_chat_notes, platform_documents, project_checklist_items

**2.3 — Contadores `active_projects` e `pending_tasks` na tabela clients sao estaticos**
- **Onde:** `clients.active_projects` e `clients.pending_tasks` sao colunas manuais, nunca atualizadas
- **Impacto:** Dashboard e cards mostram contadores desatualizados/incorretos
- **Gravidade:** MEDIA
- **Fix:** Calcular dinamicamente a partir das tabelas `projects` e `tasks` em vez de usar campos estaticos

**2.4 — Tabela `team_members` desconectada de `app_users`**
- **Onde:** `team_members` e uma tabela separada sem vinculo com `app_users`
- **Impacto:** Dados de produtividade (`completed_tasks`, `avg_time`, etc) sao estaticos e nunca atualizados; a pagina de Produtividade mostra dados falsos
- **Gravidade:** ALTA
- **Fix:** Calcular metricas dinamicamente a partir da tabela `tasks`, ou criar triggers de atualizacao

---

#### CATEGORIA 3: FRONTEND E RENDERIZACAO

**3.1 — Task ID gerado com prefixo `t_` nao e UUID valido**
- **Onde:** `AddTaskDialog.tsx` linha 133: `id: \`t_${Date.now()}\``
- **Impacto:** O hook `useAddTask` tenta validar UUID com regex `^[0-9a-f]{8}-` e gera novo UUID quando falha, mas o `t_` ID ainda e passado como `task.id`
- **Gravidade:** BAIXA (funciona porque gera UUID novo, mas e confuso)
- **Fix:** Usar `crypto.randomUUID()` diretamente

**3.2 — Subtask IDs tambem usam formato `st_` invalido**
- **Onde:** `AddTaskDialog.tsx` linha 147: `id: \`st_${Date.now()}_${i}\``
- **Impacto:** Mesmo caso do 3.1
- **Fix:** Usar `crypto.randomUUID()`

**3.3 — Warning de ref em ProjectSummaryPanel e Avatar**
- **Onde:** Console logs mostram "Function components cannot be given refs" para `ProjectSummaryPanel` e `Avatar`
- **Impacto:** Warning nao fatal mas indica uso incorreto de refs; pode causar problemas futuros
- **Gravidade:** BAIXA
- **Fix:** Adicionar `React.forwardRef` nos componentes afetados

**3.4 — Estado do formulario AddTaskDialog nao reseta ao reabrir**
- **Onde:** `AddTaskDialog.tsx` — `useState` com valores iniciais fixos, sem `useEffect` no `open`
- **Impacto:** Se o usuario abrir o dialog, preencher parcialmente, fechar e reabrir, os dados anteriores permanecem
- **Gravidade:** BAIXA
- **Fix:** Adicionar `useEffect` que chama `resetForm()` quando `open` muda para `true`

**3.5 — `assignFlowToClient` busca clientName de tasks em vez de clients**
- **Onde:** `TasksContext.tsx` linha 68: `const client = tasks.find((t) => t.clientId === clientId)`
- **Impacto:** Busca o nome do cliente na lista de TASKS (que pode estar vazia), em vez da lista de CLIENTS. `clientName` pode ser undefined
- **Gravidade:** MEDIA
- **Fix:** Buscar clientName da lista de clients, nao de tasks

---

#### CATEGORIA 4: REGRAS DE NEGOCIO

**4.1 — `clientFlows` hardcoded como objeto vazio**
- **Onde:** `TasksContext.tsx` linha 51: `const clientFlows: Record<string, string[]> = {};`
- **Impacto:** A feature de client flows nunca funciona; a tabela `client_flows` existe no banco mas nao e usada aqui
- **Gravidade:** MEDIA
- **Fix:** Usar `useClientFlowsQuery` para popular `clientFlows`

**4.2 — Fase do client-level vs platform-level**
- **Onde:** Tabela `clients` tem `phase` e tabela `client_platforms` tambem tem `phase`
- **Impacto:** Duplicidade de fonte de verdade; o kanban de squads usa `client_platforms.phase`, mas o filtro de churn no dashboard usa `client_statuses`
- **Gravidade:** MEDIA
- **Fix:** Clarificar e documentar qual campo e fonte de verdade para cada contexto

**4.3 — Contagem de "ativos" no card de squad usa logica diferente do dashboard**
- **Onde:** `ProjectsPage.tsx` linha 226 filtra por `!phase.includes('churn')`, dashboard (DashboardPage) filtra por `clientStatuses` com label churn
- **Impacto:** Numeros diferentes entre dashboard e squad cards
- **Gravidade:** MEDIA
- **Fix:** Unificar logica de deteccao de churn

---

#### CATEGORIA 5: UX E USABILIDADE

**5.1 — Nenhum loading state na pagina de Tarefas**
- **Onde:** `TasksPage.tsx` — nao verifica `isLoading` de `useTaskStatusesQuery`
- **Impacto:** Colunas do kanban ficam vazias momentaneamente sem feedback
- **Gravidade:** BAIXA

**5.2 — Erro sem feedback ao falhar mutacao de task/client**
- **Onde:** Multiplos contextos — `addTask`, `updateTask` etc nao tem `onError` handler
- **Impacto:** Se o banco rejeitar uma operacao, o usuario nao recebe nenhuma mensagem
- **Gravidade:** MEDIA
- **Fix:** Adicionar `toast.error` nos handlers `onError` das mutacoes

**5.3 — Navegacao por estado interno em vez de rotas**
- **Onde:** `Index.tsx` usa `useState('dashboard')` para navegacao; nao ha rotas reais
- **Impacto:** F5/refresh sempre volta ao dashboard; deep links nao funcionam; botao voltar do browser nao funciona
- **Gravidade:** MEDIA (intencional no design, mas limita usabilidade)

**5.4 — Filtro de responsavel na pagina de Clientes consulta `client_platforms.responsible`**
- **Onde:** `ClientsPage.tsx` linha 76 — busca responsaveis de `allClientPlatforms`
- **Impacto:** Correto conforme regra de negocio, mas o filtro e aplicado no nivel do cliente sem cruzar com plataformas, entao pode filtrar incorretamente
- **Gravidade:** BAIXA

---

### C. Priorizacao

**Corrigir imediatamente:**
1. RLS com role `public` em task_types, client_statuses, task_statuses, platforms (1.3)
2. Squad edit/delete visivel para todos (`{true &&`) (1.2)
3. getVisibleClients nao filtra por squad (1.1)

**Corrigir em seguida:**
4. Foreign keys ausentes (2.2)
5. assignFlowToClient busca clientName de tasks (3.5)
6. Feedback de erro em mutacoes (5.2)
7. team_members desconectada de app_users (2.4)

**Melhoria importante:**
8. Contadores estaticos active_projects/pending_tasks (2.3)
9. IDs nao-UUID em AddTaskDialog (3.1, 3.2)
10. Loading states nas paginas (5.1)
11. clientFlows hardcoded vazio (4.1)
12. Unificar logica de churn (4.3)

**Risco futuro:**
13. Signup publico no AuthContext (1.4)
14. Dados financeiros sem restricao por coluna (1.5)
15. Navegacao sem rotas reais (5.3)
16. forwardRef warnings (3.3)

---

### D. Plano de Correcao

**Fase 1 — Seguranca (critico)**
- Migration: alterar RLS policies de `public` para `authenticated` em 4 tabelas
- `ProjectsPage.tsx`: trocar `{true &&` por check de admin
- `ClientsContext.tsx`: implementar filtro real por squad em `getVisibleClients`
- Remover `signup` do AuthContext

**Fase 2 — Integridade de dados**
- Migration: adicionar foreign keys com CASCADE em ~8 tabelas
- Tornar contadores dinamicos (remover ou depreciar active_projects/pending_tasks)
- Fix `assignFlowToClient` para buscar client name corretamente

**Fase 3 — Estabilidade frontend**
- Usar `crypto.randomUUID()` em AddTaskDialog
- Adicionar `onError` handlers com toast em todas mutacoes
- Adicionar loading states em TasksPage e ProjectsPage
- Fix forwardRef warnings

**Fase 4 — Regras de negocio e UX**
- Unificar logica de churn entre dashboard e squads
- Implementar clientFlows do banco
- Avaliar navegacao por rotas vs estado

---

### E. Veredito Final

**Sistema: PARCIALMENTE ESTAVEL COM FRAGILIDADES RELEVANTES**

O sistema funciona para o fluxo diario basico como admin, mas possui:
- 3 vulnerabilidades de seguranca criticas (RLS publica, permissoes hardcoded, visibilidade sem filtro)
- Ausencia total de foreign keys no banco
- Dados estaticos sendo exibidos como metricas reais (produtividade, contadores)
- Gaps de feedback ao usuario em erros

A operacao nao esta em risco imediato de colapso, mas a seguranca esta comprometida e a confiabilidade dos dados exibidos e questionavel. As correcoes da Fase 1 (seguranca) sao urgentes.

