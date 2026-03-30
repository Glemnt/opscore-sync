

## Remover `as any` desnecessários dos hooks

### Situação atual
O arquivo `src/integrations/supabase/types.ts` já contém todas as 30+ tabelas (timeline_events, task_pauses, kanban_column_configs, platform_catalog, etc.). Os `as any` foram adicionados quando as tabelas ainda não existiam nos tipos, mas agora são desnecessários.

### Arquivos a alterar (14 hooks)

Em cada arquivo, remover:
- `'table_name' as any` → `'table_name'`
- `{...} as any` em `.insert()`, `.update()`, `.upsert()` → remover o cast
- `(data as any[])` → `(data ?? [])` (o tipo já é inferido)
- `(existing as any)?.[0]` → `existing?.[0]`

| Arquivo | Usos de `as any` |
|---------|-----------------|
| `useTimelineQuery.ts` | ~6 |
| `useClientPlatformChecklistQuery.ts` | ~5 |
| `useOnboardingChecklistQuery.ts` | ~4 |
| `useTaskPausesQuery.ts` | ~4 |
| `useKanbanColumnConfigsQuery.ts` | ~2 |
| `usePlatformCatalogQuery.ts` | ~4 |
| `useCsJourneyQuery.ts` | ~10+ |
| `usePhaseDemandsQuery.ts` | ~4 |
| `usePlatformsQuery.ts` | ~3 |
| `useClientStatusesQuery.ts` | ~8 |
| `useTaskStatusesQuery.ts` | ~8 |
| `useTaskTypesQuery.ts` | ~4 |
| `usePlatformPhaseStatusesQuery.ts` | ~4+ |
| `usePlatformChatNotesQuery.ts` | ~2+ |

### Exemplo de transformação

```typescript
// ANTES
const { data, error } = await supabase
  .from('timeline_events' as any)
  .select('*');
return (data as any[]).map(mapRow);

// DEPOIS
const { data, error } = await supabase
  .from('timeline_events')
  .select('*');
return (data ?? []).map(mapRow);
```

### O que NÃO muda
- `src/integrations/supabase/types.ts` — nunca editado manualmente
- `src/integrations/supabase/client.ts` — nunca editado manualmente
- Os 3 `as any` em `useAppUsersQuery.ts` (cast de erro, não de tabela) — mantidos
- `useClientFlowsQuery.ts` (`row as any` para acessar join) — mantido se o tipo de join não estiver no schema

### Resultado
- ~200+ `as any` removidos
- Type-safety real em todas as queries
- Autocompletion correto no editor

