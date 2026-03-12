

## Plano: Corrigir bloqueio de seleção de plataforma na modal Nova Plataforma

### Problema identificado

Na linha 74-76 de `AddPlatformSquadDialog.tsx`, a verificação de duplicidade filtra por `clientId` apenas:

```typescript
const existingPlatformSlugs = clientPlatformsData
  .filter(cp => cp.clientId === clientId)
  .map(cp => cp.platformSlug);
```

Isso bloqueia plataformas que o cliente já possui em **qualquer** squad. Se o cliente já tem Mercado Livre no Time Pantera, não consegue adicionar Mercado Livre no Time Foguete. Como muitos clientes já possuem plataformas em outros times, quase todas as opções aparecem bloqueadas.

### Solução

Alterar a verificação de duplicidade para considerar o squad atual (`defaultSquadId`). A plataforma só deve ser bloqueada se o cliente já a possui **neste mesmo squad**.

### Alteração

**`src/components/AddPlatformSquadDialog.tsx` (linha 74-76)**:

```typescript
const existingPlatformSlugs = clientPlatformsData
  .filter(cp => cp.clientId === clientId && cp.squadId === defaultSquadId)
  .map(cp => cp.platformSlug);
```

Apenas 1 linha alterada. A lógica de duplicidade passa a ser: "este cliente já tem esta plataforma **neste time**?" em vez de "este cliente já tem esta plataforma **em qualquer time**?".

