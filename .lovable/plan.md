

## Corrigir contadores estaticos active_projects / pending_tasks

### Problema
Os campos `active_projects` e `pending_tasks` na tabela `clients` sao estaticos (default 0, nunca atualizados). O unico lugar que consome esses valores estaticos de forma errada e o **report generator** (`reportGenerators.ts`), que exibe "Projetos Ativos: 0" e "Demandas Pendentes: 0". As paginas de UI (ClientsPage, ClientDetailModal) ja calculam dinamicamente filtrando `tasks`.

### Correções

**1. `src/lib/reportGenerators.ts`** — Calcular dinamicamente nos relatorios

- **Relatorio de squads** (L170): trocar `c.activeProjects` e `c.pendingTasks` por contagens calculadas a partir dos arrays `tasks` e `projects` passados como parametro.
- **Relatorio de cliente** (L217-218): trocar `client.activeProjects` por `clientProjects.filter(p => p.status !== 'done').length` e `client.pendingTasks` por `clientTasks.filter(t => t.status !== 'done').length`.

**2. Nenhuma mudanca de schema** — Os campos continuam no banco (remover colunas quebraria types.ts e inserts), mas deixam de ser consumidos para exibicao. Valores inseridos como 0 nos dialogs de criacao permanecem inofensivos.

### Resultado
Todos os pontos de exibicao (UI e relatorios PDF) passam a usar contagens reais calculadas dinamicamente a partir de `tasks` e `projects`.

