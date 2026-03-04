

## Plano: Sincronizar plataformas do cliente com client_platforms automaticamente

### Problema
Quando um cliente e criado ou editado na pagina Clientes e plataformas sao selecionadas, os registros em `client_platforms` nao sao criados automaticamente. O usuario precisa ir manualmente na pagina Squads para adicionar plataformas.

### Solucao

Sincronizar automaticamente: ao salvar plataformas no cliente, criar/remover registros correspondentes em `client_platforms`.

### Mudancas

**1. `src/components/AddClientDialog.tsx`**
- Importar `useAddClientPlatform` de `useClientPlatformsQuery`
- Apos `addClient(newClient)`, iterar sobre `platforms` selecionadas e chamar `addClientPlatformMut.mutate()` para cada uma, criando o registro com fase padrao 'onboarding' e o squadId do cliente

**2. `src/components/ClientDetailModal.tsx`** (botao Salvar da edicao, linha 497)
- Importar `useDeleteClientPlatform` de `useClientPlatformsQuery`
- Ao salvar edicao, comparar `editData.platforms` com as plataformas atuais do cliente
- Plataformas novas (adicionadas): criar registro em `client_platforms` via `addClientPlatformMut`
- Plataformas removidas: deletar registro correspondente em `client_platforms` via `deleteClientPlatformMut`
- Usar os dados de `useClientPlatformsQuery` ja importados para encontrar os IDs dos registros a remover

### Logica de sincronizacao (ambos os arquivos)

```text
plataformas_anteriores = client.platforms ?? []
plataformas_novas = editData.platforms ?? []

adicionadas = novas - anteriores  → criar client_platform
removidas = anteriores - novas    → deletar client_platform
```

Nenhuma migracao de banco necessaria — usa tabelas e hooks existentes.

