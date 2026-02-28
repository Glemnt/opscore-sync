

## Corrigir seleção de responsável na criação de demanda

### Problema
O dropdown de "Responsável" no `AddTaskDialog` usa `squad.members` (array de nomes de texto do squad do cliente). Se o squad não tiver membros cadastrados, ou se o usuário desejado não estiver naquele squad, não é possível selecionar.

### Solução
Usar a lista de `app_users` (usuários reais do sistema) como fonte do dropdown de responsável, em vez de depender apenas dos membros do squad. Quando um cliente é selecionado, filtrar os app_users cujos `squadIds` incluem o squad do cliente. Se nenhum cliente estiver selecionado, mostrar todos os app_users.

### Alteração

**`src/components/AddTaskDialog.tsx`**:
1. Importar `useAppUsersQuery` de `@/hooks/useAppUsersQuery`
2. Chamar `const { data: appUsers = [] } = useAppUsersQuery()`
3. Substituir o `squadMembers` memo por um que filtra `appUsers` pelo `squadId` do cliente selecionado (verificando se o squad do cliente está no array `squadIds` do usuário). Se nenhum cliente selecionado, retornar todos
4. No dropdown de responsável, renderizar os `appUsers` filtrados com `value={user.name}` e exibir `user.name`
5. Remover o `disabled={!clientId}` do select de responsável para permitir seleção mesmo sem cliente

