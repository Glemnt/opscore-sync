

## Plano: Corrigir duplicatas no dropdown de status do ClientDetailModal

### Causa raiz

A tabela `client_statuses` agora tem registros com o mesmo `key` em boards diferentes:

| key | board |
|-----|-------|
| active | clients |
| active | squads |
| onboarding | clients |
| onboarding | squads |
| inativo | clients |
| inativo | squads |

O `ClientDetailModal` chama `useClientStatusesQuery()` sem filtro de board, retornando todos os registros. Como o dropdown itera sobre todos, os status duplicados aparecem.

### Solucao

Duas correções no `ClientDetailModal.tsx`:

1. **Dropdown de status do cliente (linha 252)**: Filtrar por board `'clients'` — esse dropdown controla o status estratégico do cliente, não o operacional de squads.

2. **Dropdown de phase na plataforma (linha 111)**: Já recebe `clientStatuses` como prop — o componente pai deve passar os status filtrados por `'squads'` para esse contexto operacional.

### Alteracoes

- `src/components/ClientDetailModal.tsx`:
  - Linha 252: Trocar `useClientStatusesQuery()` para `useClientStatusesQuery('clients')` para o dropdown de status do cliente
  - Adicionar uma segunda query `useClientStatusesQuery('squads')` para passar ao `PlatformOperationalPanel`
  - Linha 479: Passar os status de squads em vez dos de clients

