

## Persistir colunas do Kanban de Squads

### Contexto

Atualmente, as colunas do Kanban de clientes dentro de um Squad são derivadas da tabela `client_statuses` (via `useEffect` que sincroniza). Porém, as ações de adicionar/remover colunas (`handleAddCol`, `handleRemoveCol`) só alteram o estado local — não persistem no banco.

A infraestrutura já existe: `useAddClientStatus()` e `useDeleteClientStatus()` no hook `useClientStatusesQuery.ts`.

### Alterações

**`src/pages/ProjectsPage.tsx`**

1. Importar `useAddClientStatus` e `useDeleteClientStatus` do hook existente
2. Modificar `handleAddCol`:
   - Abrir um mini-dialog pedindo nome da coluna (similar ao que já existe em `ClientsPage` para "Novo Status")
   - Ao confirmar, chamar `addStatusMut.mutate({ key, label, class_name })` para persistir no banco
   - A coluna aparecerá automaticamente via `useEffect` que sincroniza `clientStatuses → clientCols`
3. Modificar `handleRemoveCol`:
   - Chamar `deleteStatusMut.mutate(col.status)` para remover do banco
   - A coluna desaparecerá automaticamente via o mesmo `useEffect`
4. Remover a manipulação direta de `setClientCols` em `handleAddCol`/`handleRemoveCol`, delegando ao fluxo reativo (banco → query invalidation → useEffect sync)
5. Adicionar um dialog de confirmação antes de excluir uma coluna

### Detalhes técnicos

- O `key` da nova coluna será gerado como slug do label (ex: "Em Revisão" → `em_revisao`)
- O `class_name` usará um valor padrão (`bg-muted text-muted-foreground border-border`) ou o usuário poderá escolher uma cor
- O rename de colunas (`handleRenameCol`) será persistido usando um novo `useUpdateClientStatus` mutation que faz `update` na tabela `client_statuses`
- Não é necessária migration — a tabela `client_statuses` já existe com as policies corretas

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useClientStatusesQuery.ts` | Adicionar `useUpdateClientStatus` mutation |
| `src/pages/ProjectsPage.tsx` | Conectar add/remove/rename de colunas ao banco via mutations |

