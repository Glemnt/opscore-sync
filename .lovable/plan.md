

## Plano: Adicionar campo "Faturamento" no formulário Nova Plataforma

### Contexto
O formulário `AddPlatformSquadDialog` nao possui campo de faturamento. O `AddClientSquadDialog` ja possui esse campo, armazenando na tabela `clients.monthly_revenue`. Para plataformas, o valor deve ser armazenado em `client_platforms`.

### Alteracoes

**1. Migracao de banco — adicionar coluna `revenue_tier` em `client_platforms`**
- Nova coluna `revenue_tier text` (nullable, default null)
- Valores possiveis: `'ate-30k'`, `'30k-100k'`, `'100k-plus'`

**2. `src/components/AddPlatformSquadDialog.tsx`**
- Adicionar estado `revenueTier` (default `'ate-30k'`)
- Adicionar secao visual com 3 botoes de selecao (mesmo padrao dos botoes de Tipo de Cliente e Saude): "Até 30k", "30k - 100k", "100k+"
- Posicionar antes de "Saude da Plataforma"
- Passar `revenueTier` no `addClientPlatformMut.mutate()`
- Resetar no `resetForm()`

**3. `src/hooks/useClientPlatformsQuery.ts`**
- Adicionar `revenueTier` ao tipo `ClientPlatform`
- Mapear `revenue_tier` no `mapRow`
- Aceitar `revenueTier` no `useAddClientPlatform` e no `useUpdateClientPlatform`

