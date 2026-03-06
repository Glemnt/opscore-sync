

## Diagnostico do erro "Erro ao criar plataforma"

O banco de dados possui uma constraint **UNIQUE** na combinacao `(client_id, platform_slug)` na tabela `client_platforms`. Isso significa que **nao e possivel criar duas entradas da mesma plataforma para o mesmo cliente** (ex: dois registros de "Shopee" para o cliente X).

Quando voce tenta adicionar uma plataforma que o cliente ja possui, o banco rejeita a insercao e o dialog exibe o toast de erro generico.

## Solucao

Alterar `src/components/AddPlatformSquadDialog.tsx` para:

1. **Filtrar plataformas ja vinculadas** ao cliente selecionado, desabilitando ou ocultando as opcoes ja existentes
2. **Melhorar a mensagem de erro** para exibir o motivo real (ex: "Este cliente ja possui essa plataforma")

### Alteracoes

**`src/components/AddPlatformSquadDialog.tsx`:**
- Ao selecionar um cliente, consultar `clientPlatformsData` (ja disponivel via `useClientPlatformsQuery`) para obter os `platform_slug` ja vinculados a esse cliente
- Desabilitar visualmente os botoes de plataformas ja existentes com texto "(ja adicionada)"
- No `onError`, verificar se a mensagem contem "duplicate" ou "unique" e exibir toast mais descritivo
- Resetar `platformSlug` ao trocar de cliente (para evitar selecao invalida)

