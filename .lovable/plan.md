

## Bug Fix: Fluxos não persistem no banco de dados

### Problema encontrado
Os fluxos **não estão sendo salvos** no banco. O toast "Fluxo criado!" aparece, mas o insert falha silenciosamente porque:

1. `CreateFlowView` gera `id: \`flow_${Date.now()}\`` — que **não é UUID válido** para a coluna `flows.id` (tipo `uuid`)
2. `assignFlowToClient` gera `id: \`task_flow_${Date.now()}_${i}\`` — mesmo problema para `tasks.id`
3. O toast de sucesso é chamado **antes** da mutation completar, mascarando o erro

### Correções

**1. `src/components/FlowManagerDialog.tsx` — CreateFlowView**
- Remover geração manual de ID (`flow_${Date.now()}`)
- Usar `crypto.randomUUID()` ou omitir o `id` e deixar o banco gerar via `gen_random_uuid()`
- Converter `handleSave` para async e aguardar resultado da mutation antes de mostrar toast

**2. `src/hooks/useFlowsQuery.ts` — useAddFlow**
- Não incluir `id` no insert (deixar o DB gerar o UUID automaticamente)

**3. `src/contexts/TasksContext.tsx` — assignFlowToClient**
- Remover geração manual de ID das tasks criadas pelo fluxo
- Usar `crypto.randomUUID()` ou omitir o `id`

**4. `src/components/FlowManagerDialog.tsx` — Tratamento de erros**
- Todas as 3 views (Create, Edit, Assign) devem tratar erros da mutation com `try/catch` ou `onError`
- Toast de sucesso só após confirmação da operação

### Detalhes técnicos
- As tabelas `flows` e `tasks` têm `id uuid DEFAULT gen_random_uuid()` — omitir o ID no insert é a solução mais limpa
- As RLS policies de `flows` permitem INSERT/SELECT/UPDATE/DELETE para todos os usuários autenticados — sem restrição de acesso
- A UI do Kanban (TasksPage) não tem restrição de `accessLevel` no dropdown de Fluxos — já acessível a todos

