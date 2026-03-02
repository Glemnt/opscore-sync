

## Exibir plataformas no card do cliente

### O que mudar

**`src/pages/ClientsPage.tsx`** -- componente `ClientCard`:

1. Importar `usePlatformsQuery` do hook existente
2. Dentro do `ClientCard`, chamar `usePlatformsQuery()` para obter a lista de plataformas com seus nomes
3. Mapear os slugs armazenados em `client.platforms` para os nomes legíveis usando os dados da query
4. Renderizar as plataformas como badges/tags compactos logo abaixo do badge do squad (antes das tarefas pendentes)
   - Cada plataforma aparece como um chip pequeno (estilo similar ao badge do squad)
   - Se o cliente não tiver plataformas, nada é exibido

### Resultado visual

O card passará a mostrar, entre o squad e as tarefas pendentes, uma linha com chips como:

`[Mercado Livre] [Shopee]`

Sem alterações no banco de dados -- apenas mudança de apresentação no componente.

