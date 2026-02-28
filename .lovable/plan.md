

## Sincronizar `user_roles` ao alterar `access_level`

### Problema
A UI de edição de usuários já existe na página de Configurações, mas quando o admin altera o `access_level` de um usuário para 3 (Admin) ou rebaixa de 3, a tabela `user_roles` não é atualizada. Isso significa que o usuário promovido a nível 3 não recebe a role `admin` no RBAC, e portanto não consegue executar operações administrativas.

### Solução

**`supabase/functions/manage-users/index.ts`** — No bloco `action === "update"`, após atualizar `app_users`, sincronizar `user_roles`:

1. Buscar o `auth_user_id` do usuário sendo editado
2. Se `accessLevel === 3`: inserir role `admin` em `user_roles` (upsert/ignore conflict)
3. Se `accessLevel < 3`: remover role `admin` de `user_roles` (se existir)

```text
update app_users (name, role, access_level, squad_ids)
    ↓
fetch auth_user_id from app_users
    ↓
if accessLevel === 3 → INSERT INTO user_roles (admin) ON CONFLICT DO NOTHING
if accessLevel < 3  → DELETE FROM user_roles WHERE role = 'admin'
```

### Detalhes técnicos
- Apenas o bloco `update` do edge function `manage-users` precisa ser alterado
- Usar `adminClient` (service role) para manipular `user_roles`
- Tratar caso em que `auth_user_id` é null (usuário legado sem auth vinculado)
- Nenhuma mudança no frontend necessária — a UI já funciona corretamente

