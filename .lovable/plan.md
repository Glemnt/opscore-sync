

## Plataformas dinâmicas: criar, gerenciar e selecionar

### Problema
As plataformas (Mercado Livre, Shopee, Shein) estão hardcoded no código. Não é possível adicionar novas plataformas. Os selectors de plataforma em `AddClientDialog` e `ClientDetailModal` usam arrays estáticos.

### Solução

Criar uma tabela `platforms` no banco de dados para armazenar plataformas customizáveis, adicionar uma seção de gerenciamento na página de Configurações, e atualizar os seletores de plataforma nos formulários de cliente para ler dessa tabela.

### Alterações

**1. Criar tabela `platforms` no banco** (migration)
```sql
CREATE TABLE platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
-- RLS: authenticated users can read, insert, update, delete
-- Seed com as 3 plataformas existentes (mercado_livre, shopee, shein)
INSERT INTO platforms (name, slug) VALUES 
  ('Mercado Livre', 'mercado_livre'),
  ('Shopee', 'shopee'),
  ('Shein', 'shein');
```

**2. Criar hook `usePlatformsQuery.ts`**
- Query para listar todas as plataformas
- Mutations para adicionar e deletar plataformas

**3. Atualizar `SettingsPage.tsx`**
- Adicionar uma seção "Plataformas" abaixo da tabela de usuários
- Lista das plataformas existentes com botão de excluir
- Input + botão para adicionar nova plataforma
- Gerar `slug` automaticamente a partir do nome (lowercase, espaços → underscore)

**4. Atualizar `AddClientDialog.tsx`**
- Substituir o array hardcoded `[['mercado_livre', 'Mercado Livre'], ...]` pela lista dinâmica da query `usePlatformsQuery`
- Usar `slug` como valor e `name` como label

**5. Atualizar `ClientDetailModal.tsx`**
- Mesma substituição do array hardcoded pela lista dinâmica

**6. Atualizar tipo `Platform` em `src/types/index.ts`**
- Mudar de union type literal para `string` (para aceitar plataformas dinâmicas)
- O campo `platforms` na tabela `clients` já é `text[]`, então aceita qualquer valor

