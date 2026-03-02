

## Corrigir erro de build + garantir edição/exclusão de fluxos

### 1. Corrigir erro de build em `useClientsQuery.ts`

O erro ocorre porque a coluna `clients.status` no banco usa um enum PostgreSQL (`client_status`) com apenas 4 valores fixos, mas agora permitimos status customizados (tipo `string`). Precisamos alterar a coluna de enum para `text`.

**Migration**: `ALTER TABLE public.clients ALTER COLUMN status TYPE text;`

Isso resolve o conflito de tipos entre o `string` do TypeScript e o enum restrito do banco.

### 2. Edição e exclusão de fluxos na página de Demandas

O `FlowManagerDialog` já possui a view `EditFlowView` com funcionalidade de editar e excluir, e o dropdown "Fluxos" na `TasksPage` já tem a opção "Editar Fluxo". Porém, o `EditFlowView` usa `updateFlow` e `deleteFlow` do contexto `TasksContext`, que por sua vez chamam as mutations `useUpdateFlow` e `useDeleteFlow` do hook `useFlowsQuery` — tudo isso já existe e está funcional.

Nenhuma alteração adicional necessária para edição/exclusão de fluxos, pois a funcionalidade já está implementada. Se houver algum bug específico, ele será visível após corrigir o erro de build.

### Resumo das alterações

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | `ALTER TABLE clients ALTER COLUMN status TYPE text` |
| `useClientsQuery.ts` | Cast `status` as `any` no insert para compatibilidade com tipos gerados |

