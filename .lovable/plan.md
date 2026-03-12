

## Plano: Atualizar cadastro de usuarios com cargos reais e dados de colaborador

### Resumo

Adicionar novos cargos do Grupo TG, campos de data de entrada, data de aniversario (com idade calculada automaticamente), e reorganizar o formulario em secoes.

### 1. Migracao de banco — `app_users`

Adicionar 2 colunas:
- `hire_date` (date, nullable)
- `birthday` (date, nullable)

Alterar o enum `team_role` para incluir os novos cargos:
```sql
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'auxiliar_ecommerce';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'assistente_ecommerce';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'head';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'coo';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'ceo';
```
(O valor `cs` ja existe. Os antigos `operacional`, `design`, `copy`, `gestao` continuam no enum para compatibilidade mas nao aparecerao no dropdown.)

### 2. Tipos TypeScript — `src/types/index.ts`

Expandir `TeamRole` para incluir os novos valores.

### 3. Interface e mapper — `src/types/database.ts`

Adicionar `hireDate`, `birthday` ao `AppUserProfile` e atualizar `mapDbAppUser`.

### 4. Hook — `src/hooks/useAppUsersQuery.ts`

Adicionar `hireDate` e `birthday` nos inputs de create e update. Passar esses campos nas chamadas às edge functions.

### 5. Edge Functions

- `create-user/index.ts`: aceitar e salvar `hireDate`, `birthday`
- `manage-users/index.ts`: aceitar e salvar `hireDate`, `birthday` no update

### 6. SettingsPage — `src/pages/SettingsPage.tsx`

- Atualizar `roleLabels` com os 7 cargos novos
- Adicionar estados `hireDate` e `birthday`
- Reorganizar formulario em 2 secoes:
  - **Dados principais**: Nome, Email/Senha (create), Cargo, Nivel de Acesso, Squads
  - **Dados do colaborador**: Data de entrada, Data de aniversario, Idade (calculada, readonly)
- Idade calculada com `differenceInYears(new Date(), birthday)` de `date-fns`
- Usar Popover + Calendar (shadcn datepicker) para os campos de data
- Carregar dados existentes ao abrir edicao (`openEditDialog`)

### Arquivos alterados

- Migracao SQL (3 statements: 2 colunas + valores de enum)
- `src/types/index.ts`
- `src/types/database.ts`
- `src/hooks/useAppUsersQuery.ts`
- `supabase/functions/create-user/index.ts`
- `supabase/functions/manage-users/index.ts`
- `src/pages/SettingsPage.tsx`

