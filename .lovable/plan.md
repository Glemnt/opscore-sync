

## Fix: Chamada tripla de `app_users` e otimização de `select('*')`

### Problema 1: Triple fetch de `app_users`

Em `AuthContext.tsx`, `fetchAppUser` é chamado de **3 fontes** no carregamento:
1. `onAuthStateChange` dispara com evento `INITIAL_SESSION`
2. `onAuthStateChange` dispara com evento `SIGNED_IN` (em alguns cenários)
3. `getSession().then(...)` chama `fetchAppUser` diretamente

Como `fetchAppUser` é uma chamada direta ao Supabase (não usa React Query), não há deduplicação.

### Correção 1: Deduplicar em `AuthContext.tsx`

Adicionar um guard com `useRef` para evitar fetch redundante:

```typescript
const fetchedRef = useRef<string | null>(null);

const fetchAppUser = useCallback(async (userId: string) => {
  if (fetchedRef.current === userId) return; // já buscado
  fetchedRef.current = userId;
  const { data, error } = await supabase
    .from('app_users')
    .select('id, auth_user_id, name, email, role, access_level, squad_ids, max_capacity, hire_date, birthday, created_at')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (data && !error) {
    setCurrentUser(mapDbAppUser(data));
  } else {
    setCurrentUser(null);
  }
}, []);
```

E resetar no logout: `fetchedRef.current = null;`

### Problema 2: `select('*')` em queries pesadas

Todas as queries buscam todas as colunas, transferindo dados desnecessários.

### Correção 2: Colunas específicas nas 3 queries mais pesadas

**`useTasksQuery.ts`** — tasks tem muitas colunas; selecionar as usadas:
```typescript
supabase.from('tasks').select('id, title, client_id, client_name, project_id, project_name, responsible, type, estimated_time, real_time, deadline, status, priority, comments, platform, flow_id, platform_id, etapa, bloqueia_passagem, depende_cliente, aguardando_cliente, origem_tarefa, link_entrega, print_entrega, observacao_entrega, nota_entrega, approval_status, approved_by, approved_at, rejection_reason, rejection_count, started_at, completed_at, tempo_real_minutos, motivo_atraso, created_at')
```

**`useClientsQuery.ts`** — clients: manter `select('*')` pois quase todas as colunas são usadas no app.

**`AuthContext.tsx`** — já ajustado acima com colunas específicas.

### Arquivos alterados
- `src/contexts/AuthContext.tsx` — guard de deduplicação + colunas específicas
- `src/hooks/useTasksQuery.ts` — colunas específicas no select de tasks

