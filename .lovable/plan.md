

## Plano: Filtrar demandas geradas por plataforma no Kanban

### Problema
A funcao `getColTasks` no componente `KanbanView` (linha 1494) filtra tarefas apenas por `clientId` e `status`, ignorando o `platformSlug`. Isso faz com que tarefas criadas para uma plataforma aparecam em todas as pipelines.

### Mudanca em `src/pages/ProjectsPage.tsx`

**1. Atualizar `getColTasks` para filtrar por plataforma** (linha 1494-1496):
- Quando `platformSlug` estiver definido, adicionar filtro `t.platforms?.includes(platformSlug)`
- Quando nao estiver definido (visao "todas"), manter comportamento atual

```typescript
const getColTasks = (colStatus: string) => {
  return allTasks.filter((t) => {
    if (t.clientId !== clientId || t.status !== colStatus) return false;
    if (platformSlug) return t.platforms?.includes(platformSlug);
    return true;
  });
};
```

Nenhuma migracao necessaria. Mudanca de 3 linhas.

