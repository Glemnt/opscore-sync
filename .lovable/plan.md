

## Plano: Sincronizar squad das plataformas ao alterar squad do cliente

### Problema

Quando o squad de um cliente e alterado na pagina Clientes, os registros em `client_platforms` mantêm o `squad_id` antigo. Isso faz com que as plataformas não apareçam ao abrir o cliente pela pagina Squads do novo squad.

### Solucao

**1. `src/hooks/useClientsQuery.ts` — `useUpdateClient` (~5 linhas)**

Apos o `UPDATE` na tabela `clients`, verificar se `squad_id` foi alterado. Se sim, executar um segundo `UPDATE` em `client_platforms` para propagar o novo `squad_id` a todas as plataformas do cliente:

```typescript
// After updating clients table
if (dbUpdates.squad_id !== undefined) {
  await supabase
    .from('client_platforms')
    .update({ squad_id: dbUpdates.squad_id })
    .eq('client_id', id);
}
```

**2. Migracao de dados — corrigir registros existentes**

Executar um `UPDATE` para alinhar o `squad_id` de todos os `client_platforms` com o `squad_id` atual do cliente correspondente:

```sql
UPDATE public.client_platforms cp
SET squad_id = c.squad_id
FROM public.clients c
WHERE cp.client_id = c.id
AND (cp.squad_id IS DISTINCT FROM c.squad_id);
```

### Impacto
- 1 arquivo alterado (`useClientsQuery.ts`, ~5 linhas)
- 1 operacao de dados para corrigir registros existentes
- Nenhuma quebra de funcionalidade

