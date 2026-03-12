

## Auditoria Completa do Projeto — Diagnóstico Técnico, Funcional e UX

---

### A. Lista de Problemas Encontrados

---

#### CATEGORIA: DADOS / REGRAS DE NEGÓCIO

**1. Dados hardcoded no Dashboard — weeklyData e taskTypeData**
- **Onde:** `DashboardPage.tsx` linhas 22-38
- **Descrição:** Os gráficos "Tarefas da Semana" e "Tipos de Tarefa" usam dados estáticos hardcoded, não refletem dados reais do banco.
- **Impacto:** O usuário vê informações falsas no dashboard. Decisões operacionais baseadas em dados fictícios.
- **Gravidade:** ALTA
- **Correção:** Calcular esses dados a partir de `tasks` reais, agrupando por dia da semana e por tipo.

**2. `activeProjects` e `pendingTasks` no cliente são estáticos**
- **Onde:** Tabela `clients` colunas `active_projects` e `pending_tasks`; `ReportsPage.tsx` linhas 243-248
- **Descrição:** Esses campos são definidos na criação do cliente e nunca atualizados automaticamente. O relatório "Resumo por Cliente" exibe esses valores obsoletos em vez de contar projetos/tarefas reais.
- **Impacto:** Informações desatualizadas no resumo de relatórios e em qualquer lugar que use `client.activeProjects` ou `client.pendingTasks`.
- **Gravidade:** MÉDIA
- **Correção:** Calcular dinamicamente a partir de queries em `projects` e `tasks`, ou criar triggers de atualização.

**3. Churn medido por `startDate` em vez de data de saída**
- **Onde:** `DashboardPage.tsx` linhas 172-178
- **Descrição:** A contagem de churn filtra clientes com status churn por `startDate` (data de entrada). Deveria usar a data em que o cliente virou churn (que não existe no modelo).
- **Impacto:** Contagem de churn por período está errada — um cliente que entrou em janeiro mas saiu em março apareceria no filtro de janeiro.
- **Gravidade:** MÉDIA
- **Correção:** Adicionar campo `churned_at` ou usar o changelog para determinar quando o status mudou para churn.

**4. `responsible` ainda existe na entidade Client**
- **Onde:** `clients` table, `mapDbClient`, `AddClientDialog.tsx` linha 56/96
- **Descrição:** Embora tenha sido removido da UI de Clientes, o campo `responsible` ainda é salvo no cliente durante a criação (`AddClientDialog`). Isso cria ambiguidade com o responsável da plataforma.
- **Gravidade:** BAIXA (não causa bug visível, mas mantém dados confusos)
- **Correção:** Remover o campo `responsible` do formulário `AddClientDialog` e, se possível, depreciar na tabela.

**5. Duplicação da fonte de saúde (healthColor)**
- **Onde:** `EditPlatformDialog.tsx` linhas 97/159
- **Descrição:** `healthColor` existe tanto na plataforma (`client_platforms.health_color`) quanto no cliente (`clients.health_color`). O `EditPlatformDialog` salva `healthColor` na plataforma MAS salva `clientPotential` como `healthColor` no cliente (linha 159). São dados diferentes sendo misturados no mesmo campo.
- **Impacto:** O dashboard usa `client.healthColor` para o resumo de saúde, mas o card da plataforma usa `cp.healthColor`. Divergência silenciosa.
- **Gravidade:** ALTA
- **Correção:** Separar claramente: `clients.health_color` para saúde geral do cliente, `client_platforms.health_color` para saúde da plataforma. Não sobrescrever um com o outro.

**6. `clientFlows` no TasksContext é sempre vazio**
- **Onde:** `TasksContext.tsx` linha 51
- **Descrição:** `const clientFlows: Record<string, string[]> = {};` — hardcoded como objeto vazio. Nunca lê do banco.
- **Impacto:** A funcionalidade "Fluxos atribuídos ao cliente" não funciona no contexto de Tasks. Dados do `client_flows` existem no banco mas não são consumidos aqui.
- **Gravidade:** BAIXA

---

#### CATEGORIA: FRONTEND / RENDERIZAÇÃO

**7. `ProjectsPage.tsx` tem 1372 linhas — componente monolítico**
- **Descrição:** Um único componente com 3 views condicionais (squads, squad detail, client detail), dezenas de estados, múltiplos dialogs e modais. Difícil de manter, propenso a bugs.
- **Gravidade:** MÉDIA (risco futuro)
- **Correção:** Extrair em subcomponentes: `SquadListView`, `SquadDetailView`, `ClientDetailView`.

**8. Phase exibida como texto cru no card da plataforma**
- **Onde:** `ProjectsPage.tsx` linha 660
- **Descrição:** `<span className="... capitalize">{cp.phase}</span>` — exibe o valor bruto (ex: `implementacao`), não o label amigável (`Implementação`). O `phaseLabels` está definido mas não é usado nesta linha.
- **Gravidade:** BAIXA
- **Correção:** Usar `phaseLabels[cp.phase] ?? cp.phase` na renderização.

**9. Health colors inconsistentes entre telas**
- **Onde:** `ClientsPage.tsx` usa `green/yellow/red/white`, `ProjectsPage.tsx` card usa `green/orange/red`
- **Descrição:** No card da plataforma (linha 602-606), as cores são `green/orange/red` sem `yellow` ou `white`. No `ClientsPage`, o filtro usa `green/yellow/red/white`. As opções de saúde no `EditPlatformDialog` e `AddPlatformSquadDialog` usam `green/yellow/red`.
- **Impacto:** Se um cliente tem `healthColor = 'yellow'`, o card da plataforma não vai exibir o label correto (vai cair no fallback "— Saúde").
- **Gravidade:** MÉDIA
- **Correção:** Unificar o mapeamento de cores em um único lugar, usando as mesmas chaves (`green`, `yellow`, `red`, `white`).

**10. `now` declarado dentro do componente sem `useMemo`**
- **Onde:** `DashboardPage.tsx` linha 122
- **Descrição:** `const now = new Date()` é recriado a cada render. Usado em `useMemo` com `clientEvolutionData` (linha 199) mas `now` não está nas dependências, causando cálculos desatualizados se o componente re-renderizar em outro dia.
- **Gravidade:** BAIXA

**11. Grid quebrado quando MRR é oculto para non-admin**
- **Onde:** `DashboardPage.tsx` linhas 226-256
- **Descrição:** O grid de stats usa `grid-cols-4` mas quando `isAdmin` é false, o MRR é omitido, restando 3 cards em um grid de 4 colunas. Causa desalinhamento visual.
- **Gravidade:** BAIXA
- **Correção:** Usar `grid-cols-3` quando não é admin, ou `grid-cols-2 lg:grid-cols-${isAdmin ? 4 : 3}`.

**12. Responsável do card não exibe `phaseLabels` correto**
- **Onde:** `ProjectsPage.tsx` linha 660
- **Descrição:** Já mencionado no item 8 — `cp.phase` é exibido com `capitalize` CSS em vez de usar o mapeamento definido.

---

#### CATEGORIA: PERMISSÃO / SEGURANÇA

**13. Faturamento acessível via API mesmo para non-admin**
- **Onde:** RLS policies em `clients`
- **Descrição:** As políticas RLS permitem SELECT completo para qualquer usuário autenticado. O campo `monthly_revenue` e `setup_fee` estão acessíveis no banco para qualquer usuário. A restrição é apenas no frontend.
- **Impacto:** Um usuário técnico pode usar o DevTools ou a API diretamente para ver dados financeiros.
- **Gravidade:** ALTA
- **Correção:** Criar uma VIEW que exclui campos financeiros para non-admin, ou adicionar RLS mais granular. Alternativamente, aceitar o risco se todos os usuários são internos de confiança.

**14. Signup público permite criação de usuários sem controle**
- **Onde:** `LoginPage.tsx` — botão "Cadastre-se"; `AuthContext.tsx` `signup` method
- **Descrição:** Qualquer pessoa pode criar uma conta via signup público. O usuário criado recebe `access_level: 1` e `squad_ids: []`, o que significa que não vê dados, mas a conta auth é criada no sistema.
- **Impacto:** Potencial de criação de contas spam. O ideal para um sistema interno seria permitir criação apenas via admin.
- **Gravidade:** MÉDIA
- **Correção:** Remover o signup público da `LoginPage` e manter criação de usuários apenas via `SettingsPage` (admin).

**15. Exclusão de squad sem confirmação**
- **Onde:** `ProjectsPage.tsx` linha 140
- **Descrição:** `handleDeleteSquad` chama `removeSquad(id)` diretamente no click, sem AlertDialog de confirmação. Um clique acidental pode excluir um squad inteiro.
- **Impacto:** Perda de dados sem possibilidade de desfazer.
- **Gravidade:** ALTA
- **Correção:** Adicionar AlertDialog de confirmação antes de excluir.

**16. Qualquer usuário autenticado pode modificar qualquer dado**
- **Onde:** Todas as tabelas com políticas RLS `USING (true)` e `WITH CHECK (true)`
- **Descrição:** As políticas de INSERT, UPDATE, DELETE em quase todas as tabelas permitem que qualquer usuário autenticado modifique qualquer registro. Não há isolamento por squad ou por role no banco.
- **Gravidade:** MÉDIA (aceitável se o sistema é usado apenas por equipe interna confiável)
- **Correção:** Para um sistema multi-tenant ou com mais usuários, implementar RLS baseada em squad/role.

---

#### CATEGORIA: UX / USABILIDADE

**17. Sem feedback de loading ao criar plataforma/cliente**
- **Onde:** `AddClientDialog.tsx` — botão "Adicionar Cliente"
- **Descrição:** O botão de submit não mostra estado de loading durante a mutação. Se a rede estiver lenta, o usuário pode clicar múltiplas vezes.
- **Gravidade:** BAIXA
- **Correção:** Adicionar `disabled` com estado de pending da mutation.

**18. Status "active" vs status dinâmicos — confusão de fonte de verdade**
- **Onde:** `ClientsPage.tsx` linha 107, `ReportsPage.tsx` linha 77
- **Descrição:** Em vários lugares o código faz `c.status !== 'inactive'` ou `c.status === 'active'` com strings hardcoded. Mas os status são configuráveis dinamicamente via `client_statuses`. Se o admin renomear "active" para algo diferente, esses filtros quebram.
- **Gravidade:** MÉDIA
- **Correção:** Usar a tabela `client_statuses` como fonte de verdade para determinar quais status representam "ativo" ou "inativo".

**19. Reports usa `taskTypeConfig` hardcoded**
- **Onde:** `ReportsPage.tsx` linhas 197-199, 268
- **Descrição:** A tabela "Tarefas por Tipo" usa `taskTypeConfig` importado de `config.ts` (hardcoded) em vez da tabela dinâmica `task_types`. Se o admin adicionar novos tipos, eles não aparecem nos relatórios.
- **Gravidade:** MÉDIA
- **Correção:** Usar `useTaskTypesQuery` em vez de `taskTypeConfig`.

**20. EditPlatformDialog — select de "Status" do cliente tem apenas 2 opções**
- **Onde:** `EditPlatformDialog.tsx` linhas 202-205
- **Descrição:** O select de status tem apenas "Ativo" e "Inativo" hardcoded, enquanto o sistema suporta status dinâmicos configuráveis.
- **Gravidade:** MÉDIA
- **Correção:** Usar `useClientStatusesQuery` para popular as opções dinamicamente.

**21. EditPlatformDialog — "Fase" do cliente tem opções fixas (`onboarding/reuniao_agendada`)**
- **Onde:** `EditPlatformDialog.tsx` linhas 208-213
- **Descrição:** A "Fase do Cliente" tem apenas 2 opções hardcoded que diferem das 4 etapas definidas para plataformas.
- **Gravidade:** BAIXA

**22. Sem empty state na página de Squads quando lista está vazia**
- **Onde:** `ProjectsPage.tsx` — grid de squads
- **Descrição:** Se não há squads visíveis, a página mostra um grid vazio sem mensagem orientativa.
- **Gravidade:** BAIXA

---

#### CATEGORIA: PERFORMANCE

**23. Queries sem paginação — risco com crescimento de dados**
- **Onde:** Todas as queries (`useClientsQuery`, `useTasksQuery`, etc.)
- **Descrição:** Todas as queries fazem `select('*')` sem limit. Com crescimento de dados, pode atingir o limite de 1000 rows do Supabase e/ou causar lentidão.
- **Gravidade:** BAIXA (risco futuro)
- **Correção:** Implementar paginação quando necessário.

**24. `useClientPlatformsQuery` chamado em múltiplos componentes**
- **Onde:** `ClientsPage`, `ProjectsPage`, `AddPlatformSquadDialog`, `EditPlatformDialog`, `ClientCard`
- **Descrição:** Cada componente que precisa de `client_platforms` faz sua própria chamada. Embora o `react-query` faça cache, componentes como `ClientCard` chamam dentro de um `.map()`, gerando múltiplas instâncias.
- **Gravidade:** BAIXA (react-query deduplica, mas gera hooks desnecessários)

---

#### CATEGORIA: EDGE CASES

**25. Signup cria `app_users` entry mas falha silenciosamente se email não confirmado**
- **Onde:** `AuthContext.tsx` `signup` linhas 78-93
- **Descrição:** Quando o usuário se cadastra, o `app_users` e `user_roles` são inseridos imediatamente. Se o email não for confirmado e o usuário nunca logar, restam registros órfãos no banco.
- **Gravidade:** BAIXA

**26. `assignFlowToClient` procura clientName em tasks, não em clients**
- **Onde:** `TasksContext.tsx` linhas 67-69
- **Descrição:** `const client = tasks.find((t) => t.clientId === clientId)` busca o nome do cliente nas tasks existentes. Se o cliente não tem tasks, `clientName` será o próprio `clientId`.
- **Gravidade:** MÉDIA
- **Correção:** Receber `clientName` como parâmetro ou buscar de outro contexto.

**27. Dual QueryClient — potencial conflito de cache**
- **Onde:** `App.tsx` linha 9 e `Index.tsx` linha 16
- **Descrição:** Existem dois `QueryClient` criados — um em `App.tsx` e outro em `Index.tsx`. Ambos envolvem a app em `QueryClientProvider`. O de `Index.tsx` está aninhado dentro do de `App.tsx`, o que significa que o de `Index.tsx` é o que efetivamente é usado.
- **Impacto:** O `QueryClient` de `App.tsx` é efetivamente inútil. Pode causar confusão e, em cenários raros, problemas de cache.
- **Gravidade:** BAIXA
- **Correção:** Remover o `QueryClientProvider` de `App.tsx` e mantê-lo apenas em `Index.tsx`.

---

### B. Classificação por Categoria

| Categoria | Problemas |
|---|---|
| **Dados / Regras de Negócio** | #1, #2, #3, #4, #5, #6 |
| **Frontend / Renderização** | #7, #8, #9, #10, #11, #12 |
| **Permissão / Segurança** | #13, #14, #15, #16 |
| **UX / Usabilidade** | #17, #18, #19, #20, #21, #22 |
| **Performance** | #23, #24 |
| **Edge Cases** | #25, #26, #27 |

---

### C. Priorização

**Crítico — corrigir primeiro:**
- #1 — Dados hardcoded no Dashboard (gráficos falsos)
- #5 — healthColor duplicada/sobrescrita entre cliente e plataforma
- #13 — Faturamento acessível via API para non-admin
- #15 — Exclusão de squad sem confirmação

**Importante mas não bloqueante:**
- #3 — Churn medido por startDate
- #9 — Health colors inconsistentes entre telas
- #14 — Signup público permite criação sem controle
- #18 — Status hardcoded vs dinâmico
- #19 — Reports usa taskTypeConfig hardcoded
- #20 — Status do cliente hardcoded no EditPlatformDialog
- #26 — assignFlowToClient busca nome em tasks
- #27 — Dual QueryClient

**Melhoria de qualidade/UX:**
- #2 — activeProjects/pendingTasks estáticos
- #4 — responsible na entidade Client
- #8 — Phase label no card
- #11 — Grid desalinhado sem MRR
- #17 — Loading no botão de criação
- #22 — Empty state Squads

**Risco futuro:**
- #7 — Componente monolítico
- #16 — RLS permissiva
- #23 — Sem paginação
- #24 — Queries em componentes repetidos

---

### D. Correções Propostas (Top 5 Prioridades)

1. **Dashboard real:** Substituir `weeklyData` e `taskTypeData` por cálculos reais a partir das tasks do banco, agrupando por `createdAt`/`deadline` (semana) e por `type`.

2. **Unificar healthColor:** Definir um mapeamento único (`green/yellow/red/white`) usado em todos os componentes. No card da plataforma, mapear `yellow` → `🟡 Atenção` (hoje falta). Não sobrescrever `clients.health_color` com `clientPotential`.

3. **Confirmar exclusão de squad:** Adicionar `AlertDialog` antes de `removeSquad` em `ProjectsPage.tsx`.

4. **Remover signup público:** Remover o toggle "Não tem conta? Cadastre-se" da `LoginPage`. Manter criação de usuários exclusivamente via admin.

5. **Corrigir status/types dinâmicos:** Substituir `taskTypeConfig` hardcoded por `useTaskTypesQuery` nos Reports. Usar `client_statuses` em vez de comparações hardcoded com `'active'` e `'inactive'`.

---

### E. Conclusão — Verificação de Consistência Global

O sistema está **parcialmente consistente com pontos frágeis importantes**:

- A arquitetura base (React + Supabase + react-query) está bem estruturada
- A separação Cliente/Plataforma está implementada e funcional
- A visibilidade por squads e liderança foi corrigida recentemente e está global
- O controle de faturamento por admin está implementado no frontend

**Pontos frágeis:**
- Dashboard com dados fictícios compromete a confiabilidade das decisões
- Duplicação da fonte de verdade de saúde (cliente vs plataforma) gera divergência silenciosa
- Restrição de dados financeiros é apenas frontend (sem proteção no banco)
- Status e tipos hardcoded convivem com configurações dinâmicas, criando inconsistência
- Signup público em sistema interno é um risco
- Exclusão de squad sem confirmação pode causar perda de dados

O sistema funciona para operação diária, mas precisa das correções críticas para ser confiável a médio prazo.

