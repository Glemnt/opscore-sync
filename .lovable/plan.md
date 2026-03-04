

## Plano: Adicionar Telefone, CNPJ e Email ao Cliente

### Mudanças necessarias

**1. Migração de banco de dados** — Adicionar 3 colunas na tabela `clients`:
```sql
ALTER TABLE public.clients ADD COLUMN phone text DEFAULT '';
ALTER TABLE public.clients ADD COLUMN cnpj text DEFAULT '';
ALTER TABLE public.clients ADD COLUMN email text DEFAULT '';
```

**2. Tipo TypeScript** (`src/types/index.ts`) — Adicionar `phone?: string`, `cnpj?: string`, `email?: string` na interface `Client`.

**3. Formulário de criação** (`src/components/AddClientDialog.tsx`):
- Adicionar 3 estados: `phone`, `cnpj`, `email`
- Adicionar campos de input na aba "Dados" (telefone e email numa row grid-cols-2, CNPJ em row própria)
- Incluir os campos no `resetForm` e no objeto `newClient` do `handleSubmit`

**4. Hook de persistência** (`src/hooks/useClientsQuery.ts`):
- No `useAddClient`, incluir `phone`, `cnpj`, `email` no insert
- No `useUpdateClient`, adicionar mapeamento camelCase→snake_case
- No `mapDbClient` (types/database.ts), mapear as novas colunas

**5. Mapeamento DB** (`src/types/database.ts`) — Adicionar `phone`, `cnpj`, `email` na interface `DbClient` e no `mapDbClient`.

**6. Card do cliente** (`src/pages/ClientsPage.tsx`) — Na linha de metadados (junto com Responsável e Data de Entrada), adicionar badges para Telefone, CNPJ e Email quando preenchidos.

**7. Modal de detalhe** (`src/components/ClientDetailModal.tsx`) — Adicionar campos editáveis para telefone, CNPJ e email na seção de dados do cliente.

