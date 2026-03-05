

## Plano: Corrigir filtro de responsavel e modelo de edicao do card de cliente

### Problema 1: Filtro de responsavel

Na pagina Clientes (L69) e Squads (L401), `uniqueResponsibles` e extraido dos clientes visiveis. O filtro compara `c.responsible === responsibleFilter` (exato). O problema e que **nem todos os clientes podem ter o campo `responsible` preenchido**, ou o valor do responsavel pode ter diferencas de case/espaco. Alem disso, na pagina Squads, `uniqueResponsibles` e derivado de `squadClients` (filtrado por squad), entao so mostra responsaveis daquele squad — mas os clientes filtrados (`filteredSquadClients`) tambem sao filtrados por squad, entao isso deve estar correto.

**Investigacao adicional necessaria**: O problema pode estar em que o `client.responsible` na base esta diferente do nome exibido no dropdown. Tambem pode ser que `healthColor` e `null` em vez de `'white'`, causando falha no filtro de saude que cascateia (L407 faz `c.healthColor === squadHealthFilter` sem tratar null como `'white'`).

**Correcao**: Na pagina Squads (L407), o filtro de saude compara `c.healthColor === squadHealthFilter` sem tratar null. Na pagina Clientes (L77), ja trata com `(c.healthColor ?? 'white')`. Precisamos igualar o comportamento.

### Problema 2: Edicao do card do cliente

Atualmente o `ClientDetailModal` tem dois mecanismos de edicao:
1. **EditableField** (L289-358): edicao inline por campo com icone de lapis no hover — cada campo salva individualmente
2. **editMode** (L410-517): formulario completo de edicao ativado pelo botao de lapis no header — salva tudo ao clicar "Salvar"

O usuario quer que **so** o modo de edicao completo (editMode) funcione. Campos fora do editMode devem ser somente leitura. Tambem deve incluir saude do cliente e outros campos editaveis diretamente.

### Mudancas

**1. `src/pages/ProjectsPage.tsx`** (~2 linhas):
- L407: Trocar `c.healthColor === squadHealthFilter` por `(c.healthColor ?? 'white') === squadHealthFilter`

**2. `src/components/ClientDetailModal.tsx`** (~30 linhas):
- Remover a funcionalidade de edicao inline do `EditableField`: remover o botao de lapis do hover e os handlers `startEdit`/`saveEdit`/`cancelEdit`. O componente passa a exibir apenas o valor em modo somente leitura (sem edicao inline)
- Mover o seletor de saude do cliente para dentro do formulario `editMode`
- Garantir que campos como status, plataformas operacionais, fluxos, etc. fiquem somente leitura quando `editMode === false`
- O formulario de edicao completo (editMode) ja funciona e salva corretamente — sera o unico mecanismo de edicao

Sem migracao de banco.

