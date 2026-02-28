

## Plano: Migrar todos os dados para banco de dados (Lovable Cloud / Supabase)

Este é um projeto grande que precisa ser feito em etapas. Vou configurar o Lovable Cloud e criar tabelas para persistir **todas** as entidades: usuários, clientes, squads, tarefas, projetos, fluxos, templates e logs.

---

### Etapa 1 — Ativar Lovable Cloud e criar as tabelas

Tabelas a criar:

| Tabela | Campos principais |
|---|---|
| `squads` | id, name, leader, members (text[]) |
| `clients` | id, name, company_name, segment, responsible, squad_id (FK), start_date, status, notes, monthly_revenue, active_projects, pending_tasks, contract_type, payment_day, contract_duration_months, platforms (text[]), health_color, logo |
| `client_change_logs` | id, client_id (FK), field, old_value, new_value, changed_by, changed_at |
| `client_chat_notes` | id, client_id (FK), message, author, created_at |
| `projects` | id, client_id (FK), client_name, name, type, responsible, start_date, deadline, priority, status, progress |
| `project_checklist_items` | id, project_id (FK), label, done |
| `tasks` | id, title, client_id, client_name, project_id, project_name, responsible, type, estimated_time, real_time, deadline, status, priority, comments, created_at |
| `subtasks` | id, task_id (FK), label, done, checked_by, checked_at |
| `task_chat_notes` | id, task_id (FK), message, author, created_at |
| `flows` | id, name, steps (text[]), created_at |
| `custom_templates` | id, name, subtasks (text[]) |
| `client_flows` | id, client_id, flow_id |
| `app_users` | id, name, login, role, access_level, squad_ids (text[]) |
| `team_members` | id, name, role, squad_id, completed_tasks, avg_time, late_tasks, current_load, on_time_pct |

Autenticação será via Supabase Auth (email/password), substituindo o login hardcoded.

---

### Etapa 2 — Seed dos dados iniciais

Inserir os dados que hoje estão em `mockData.ts` nas tabelas criadas, para que o sistema já tenha dados ao iniciar.

---

### Etapa 3 — Criar hooks de acesso ao banco

Criar custom hooks usando `@tanstack/react-query` + cliente Supabase para cada entidade:

- `useClientsQuery` — CRUD de clientes, change logs, chat notes
- `useTasksQuery` — CRUD de tarefas, subtasks, chat notes
- `useProjectsQuery` — CRUD de projetos e checklist items
- `useSquadsQuery` — CRUD de squads
- `useFlowsQuery` — CRUD de flows e templates
- `useAppUsersQuery` — CRUD de usuários do sistema

---

### Etapa 4 — Refatorar os Contexts

Atualizar os 4 contextos (`AuthContext`, `ClientsContext`, `TasksContext`, `SquadsContext`) para usar os hooks do Supabase ao invés de `useState` com dados mock:

- **AuthContext**: Migrar para Supabase Auth com `signInWithPassword` / `signOut`. Carregar perfil de `app_users`.
- **ClientsContext**: Todas as operações (add, update, delete, chatNotes, changeLogs) vão para o banco.
- **TasksContext**: Tasks, subtasks, flows, templates — tudo persistido.
- **SquadsContext**: CRUD de squads no banco.

---

### Etapa 5 — Atualizar páginas e componentes

- Remover importações diretas de `mockData.ts`
- Páginas que importam `clients`, `projects`, `tasks` diretamente (ex: `ProjectsPage`, `DashboardPage`, `SettingsPage`) passam a usar dados dos contexts/hooks
- Adicionar estados de loading/error onde necessário

---

### Etapa 6 — RLS (Row Level Security)

Configurar políticas de segurança para que:
- Usuários autenticados possam ler/escrever nas tabelas
- Dados sensíveis (senhas) nunca sejam expostos via SELECT

---

### Observações

- O arquivo `mockData.ts` será mantido apenas como referência até a migração estar completa, depois pode ser removido
- Esta migração será feita incrementalmente — entidade por entidade — para minimizar riscos
- Cada etapa será uma mensagem separada para manter as mudanças gerenciáveis

