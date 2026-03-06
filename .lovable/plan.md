

## Plano: Garantir que cliente criado via Squads salve no banco e apareca no Kanban

### Diagnostico

O codigo atual ja faz o fluxo correto:
1. `AddClientSquadDialog.handleSubmit()` chama `addClient()` que insere na tabela `clients` com `squad_id = defaultSquadId`
2. Cria registros em `client_platforms` com o mesmo `squad_id`
3. O Kanban filtra por `clients.filter(c => c.squadId === selectedSquad.id)`

**Porem ha um bug potencial:** A coluna `platforms` na tabela `clients` e do tipo `platform_type[]` (enum com apenas `mercado_livre`, `shopee`, `shein`). O slug `tik_tok` existe na tabela `platforms` mas nao no enum. Se o usuario selecionar TikTok, o INSERT falha silenciosamente e o cliente nao aparece.

### Alteracoes

**1. Migracao de banco — alterar coluna `platforms` de `platform_type[]` para `text[]`**
```sql
ALTER TABLE public.clients ALTER COLUMN platforms TYPE text[] USING platforms::text[];
```
Isso permite que qualquer plataforma cadastrada na tabela `platforms` seja salva sem restricao de enum.

**2. `src/components/AddClientSquadDialog.tsx` — adicionar feedback de erro**
- Adicionar toast de sucesso ("Cliente criado com sucesso") apos o submit
- Adicionar toast de erro caso a mutacao falhe, usando `onError` no `addClientMut`

**3. `src/contexts/ClientsContext.tsx` — invalidar `client_platforms` apos criar cliente**
- No callback `addClient`, alem de chamar `addClientMut.mutate`, garantir que a query `client_platforms` tambem seja invalidada apos sucesso (ja acontece via `useAddClientPlatform`, mas pode haver race condition)

Nenhuma alteracao de logica no Kanban e necessaria — ele ja filtra corretamente por `squadId`.

