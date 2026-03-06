

## Plano: Adicionar campos ao formulario "Nova Plataforma"

### Analise

Dos 4 campos solicitados, 2 ja existem no banco:
- **Data de onboarding** → coluna `start_date` (ja existe, so falta o campo no formulario)
- **Responsavel pelo Onboarding** → coluna `responsible` (ja existe no formulario)

2 campos precisam de novas colunas:
- **Origem** → nova coluna `origin` (text)
- **Vendedor responsavel** → nova coluna `sales_responsible` (text)

### 1. Migracao de banco de dados

Adicionar 2 colunas a `client_platforms`:
```sql
ALTER TABLE client_platforms ADD COLUMN origin text NOT NULL DEFAULT '';
ALTER TABLE client_platforms ADD COLUMN sales_responsible text NOT NULL DEFAULT '';
```

### 2. Hook `useClientPlatformsQuery.ts`

- Adicionar `origin` e `salesResponsible` ao tipo `ClientPlatform`
- Mapear `origin` e `sales_responsible` em `mapRow`
- Aceitar `origin` e `salesResponsible` no input de `useAddClientPlatform`

### 3. Dialog `AddPlatformSquadDialog.tsx`

Adicionar ao formulario:
- **Data de Onboarding**: DatePicker (Popover + Calendar) usando `start_date`
- **Origem**: input text livre
- **Vendedor Responsavel**: dropdown dos `appUsers` (mesmo padrao do responsavel)

Atualizar `handleSubmit` para enviar `startDate`, `origin` e `salesResponsible`.
Atualizar `resetForm` para limpar os novos estados.

