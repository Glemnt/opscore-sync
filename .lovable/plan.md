

## Diagnostico

O Kanban de Squads filtra clientes usando `clients.filter(c => c.squadId === selectedSquad.id)` (linha 325). Quando voce cria uma "Nova Plataforma" pelo dialog, ele so cria um registro em `client_platforms` com o `squad_id` do squad selecionado — mas **nao altera o `squad_id` do cliente**.

Se o cliente selecionado pertence a outro squad (ou nenhum), ele nao aparece no Kanban deste squad, e portanto a plataforma criada fica invisivel.

## Solucao

Alterar a filtragem do Kanban em `ProjectsPage.tsx` para incluir clientes que:
1. Possuem `squadId === selectedSquad.id` (comportamento atual), **OU**
2. Possuem pelo menos uma `client_platform` com `squad_id === selectedSquad.id`

### Alteracao: `src/pages/ProjectsPage.tsx`

**Linha 325** — Expandir `squadClients` para considerar tambem as plataformas:

```typescript
// Antes
const squadClients = clients.filter((c) => c.squadId === selectedSquad.id);

// Depois
const clientIdsWithPlatformsInSquad = new Set(
  clientPlatformsData
    .filter(cp => cp.squadId === selectedSquad.id)
    .map(cp => cp.clientId)
);
const squadClients = clients.filter(
  (c) => c.squadId === selectedSquad.id || clientIdsWithPlatformsInSquad.has(c.id)
);
```

**Linha 202** (card do squad na listagem inicial) — Aplicar a mesma logica para que a contagem de clientes tambem reflita plataformas vinculadas:

```typescript
const cpIdsInSquad = new Set(
  clientPlatformsData
    .filter(cp => cp.squadId === squad.id)
    .map(cp => cp.clientId)
);
const squadClients = clients.filter(
  (c) => c.squadId === squad.id || cpIdsInSquad.has(c.id)
);
```

Nenhuma outra alteracao necessaria — `clientPlatformsData` ja esta carregado na linha 60.

