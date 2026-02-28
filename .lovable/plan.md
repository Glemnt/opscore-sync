

## Plano: Criar usuário admin para teste

### Etapa 1 — Habilitar auto-confirm de email
Usar a ferramenta de configuração de auth para ativar auto-confirm de email, permitindo login imediato sem verificação.

### Etapa 2 — Criar usuário via signup no código
Usar o formulário de signup da aplicação para criar o usuário com email e senha. O `AuthContext.signup` já insere automaticamente na tabela `app_users` com role `operacional` e `access_level = 1`, e na `user_roles` com role `user`.

### Etapa 3 — Promover a admin via SQL (insert tool)
Após o signup, executar duas operações de dados:
1. `UPDATE app_users SET access_level = 3, role = 'gestao' WHERE login = '<email>'`
2. `INSERT INTO user_roles (user_id, role) VALUES ('<auth_user_id>', 'admin')` — usando o `auth_user_id` da tabela `app_users`

### Fluxo prático
1. Ativar auto-confirm
2. Acessar a página de login no preview, alternar para "Cadastre-se", preencher nome/email/senha
3. Após signup bem-sucedido, promover o usuário via SQL

