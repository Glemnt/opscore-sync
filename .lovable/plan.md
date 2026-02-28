

## Diagnóstico e Correção

### Causa raiz
Os logs mostram que as chamadas recentes ao `manage-users` retornaram **401 (Unauthorized)**, não um erro de lógica. O log de autenticação confirma: `"session id (ad02a1e2-...) doesn't exist"`. Ou seja, a sessão expirou entre a promoção (que funcionou com status 200) e a tentativa de rebaixamento.

A mensagem genérica "Edge Function returned a non-2xx status code" aparece porque o SDK do frontend não extrai o corpo da resposta de erro — ele só repassa a mensagem padrão.

### Solução

Dois ajustes:

1. **Melhorar o tratamento de erro no frontend** (`src/hooks/useAppUsersQuery.ts`): Nas mutations `useUpdateAppUser` e `useDeleteAppUser`, quando `supabase.functions.invoke` retorna erro, extrair o corpo da resposta para mostrar a mensagem real (ex: "Unauthorized", "Forbidden: admin only") em vez do genérico do SDK.

2. **Ação imediata**: Você precisa **fazer login novamente** no preview para renovar a sessão, e então a operação de rebaixamento funcionará normalmente.

### Detalhe técnico

No `supabase.functions.invoke`, quando o status é non-2xx, o SDK retorna `{ error: FunctionsHttpError }`. O corpo real fica em `error.context` (a Response). Para extrair:

```text
const { data, error } = await supabase.functions.invoke(...)
if (error) {
  const body = await error.context?.json?.();
  throw new Error(body?.error || error.message);
}
```

Isso será aplicado nas 3 mutations: `useCreateAppUser`, `useUpdateAppUser`, `useDeleteAppUser`.

