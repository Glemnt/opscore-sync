

## Plano: Separar Status (Ativo/Inativo) e adicionar campo Fase (Onboarding/Reunião Agendada)

### Resumo
Alterar o campo "Status" para exibir apenas **Ativo** e **Inativo**, e adicionar um novo campo **Fase** com as opções **Onboarding** e **Reunião Agendada**. Ambos os campos aparecerão nos formulários de edição das páginas Clientes e Squads.

### Alteração no banco de dados
Adicionar coluna `phase` na tabela `clients`:
```sql
ALTER TABLE public.clients ADD COLUMN phase text NOT NULL DEFAULT 'onboarding';
```

### Arquivos alterados

**1. `src/components/EditPlatformDialog.tsx` (página Squads)**
- Substituir o dropdown de Status (que lista todos os `clientStatuses`) por um select fixo com apenas "Ativo" e "Inativo"
- Adicionar novo state `clientPhase` e dropdown "Fase" com opções "Onboarding" e "Reunião Agendada"
- Incluir `phase` no payload do `updateClientMut`

**2. `src/components/ClientDetailModal.tsx` (página Clientes)**
- No formulário de edição (editMode), substituir o dropdown de Status (linhas 355-360) por apenas Ativo/Inativo
- Adicionar dropdown "Fase" com Onboarding/Reunião Agendada
- Incluir `phase` no `editData` e no save

**3. `src/hooks/useClientsQuery.ts`** — garantir que o campo `phase` é mapeado na query e no tipo Client

**4. `src/types/index.ts`** — adicionar `phase?: string` à interface Client

