

## Plano: Criar todas as tabelas e migrar dados para o banco

Este é o primeiro passo da migração. Vou criar todas as tabelas necessárias no banco de dados, inserir os dados iniciais, e depois atualizar o código para ler/escrever do banco.

Como é um projeto grande, vou dividir em **3 mensagens**:

---

### Mensagem 1 (esta) — Criar schema do banco

Executar uma migração SQL criando:

1. **Enums**: `client_status`, `project_status`, `task_status`, `priority_level`, `task_type`, `project_type`, `team_role`, `contract_type`, `platform_type`, `health_color`, `app_role`
2. **Tabelas**: `squads`, `clients`, `client_change_logs`, `client_chat_notes`, `projects`, `project_checklist_items`, `tasks`, `subtasks`, `task_chat_notes`, `flows`, `custom_templates`, `client_flows`, `app_users`, `team_members`, `user_roles`
3. **RLS**: Habilitar em todas as tabelas com políticas para usuários autenticados
4. **Função `has_role`**: Para verificação segura de roles sem recursão
5. **Seed**: Inserir todos os dados de `mockData.ts` nas tabelas

---

### Mensagem 2 — Criar hooks e atualizar contexts

- Criar hooks com `@tanstack/react-query` para cada entidade (`useClientsQuery`, `useTasksQuery`, `useProjectsQuery`, `useSquadsQuery`, etc.)
- Refatorar `ClientsContext`, `TasksContext`, `SquadsContext` para usar o banco
- Atualizar `AuthContext` para usar autenticação do Lovable Cloud

---

### Mensagem 3 — Atualizar páginas e remover mockData

- Remover todas as importações diretas de `mockData.ts` nas 15 files que usam
- Adicionar loading/error states nas páginas
- Atualizar `LoginPage` para usar autenticação real

---

### Detalhes técnicos do schema

```text
squads ──< clients ──< client_change_logs
                   ──< client_chat_notes
                   ──< projects ──< project_checklist_items
                   ──< tasks ──< subtasks
                             ──< task_chat_notes
                   ──< client_flows >── flows

app_users (linked to auth.users)
user_roles (linked to auth.users)
team_members
custom_templates
```

Todas as tabelas usam `uuid` como primary key com `gen_random_uuid()` default, exceto onde IDs existentes precisam ser preservados para o seed.

