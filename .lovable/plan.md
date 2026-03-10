

## Plano: Sincronização automática de client_platforms no EditPlatformDialog

### Problema
Quando o usuário altera as plataformas de um cliente no `EditPlatformDialog` (página Squads), apenas o array `platforms` na tabela `clients` é atualizado. Os registros correspondentes na tabela `client_platforms` não são criados/removidos, causando desincronização com o Kanban.

### Solução
Replicar a lógica já existente no `ClientDetailModal` (linhas 446-454): comparar plataformas antigas vs novas, inserir registros para as adicionadas e deletar registros para as removidas.

### Alteração

**`src/components/EditPlatformDialog.tsx`**
1. Importar `useAddClientPlatform`, `useDeleteClientPlatform`, `useClientPlatformsQuery`
2. No `handleSubmit`, antes de chamar `updateClientMut`, calcular diff entre `client.platforms` (antigo) e `platforms` (novo)
3. Para cada slug adicionado: `addClientPlatformMut.mutate({ clientId, platformSlug, phase: 'onboarding', squadId })`
4. Para cada slug removido: buscar o registro em `client_platforms` e `deleteClientPlatformMut.mutate(record.id)`

Mesmo padrão usado na página de Clientes — nenhuma alteração no banco.

