

## Plano: Tornar cards de plataforma independentes no Kanban de Squads

### Problema

Ao arrastar um card no Kanban de Squads, todos os cards do mesmo cliente se movem juntos. Isso ocorre porque o drag-and-drop usa `client.id` e atualiza `client.status` — um campo compartilhado entre todas as plataformas do cliente.

### Solução

Usar o campo `cp.phase` (já existente na tabela `client_platforms`) em vez de `client.status` para posicionar e mover os cards individualmente.

### Alteracoes em `src/pages/ProjectsPage.tsx`

**1. Drag: passar `cp.id` em vez de `client.id`**
- Linha ~689: `e.dataTransfer.setData('text/plain', cp.id)` em vez de `client.id`
- Linha ~691: `setDraggingClientId(cp.id)` em vez de `client.id`
- Linha ~693: comparar com `cp.id`
- Linha ~697: comparar com `cp.id`

**2. Drop: atualizar `cp.phase` via `useUpdateClientPlatform`**
- Linhas ~618-621 e ~671-674: trocar `updateClientField(clientId, 'status', col.status, 'Status')` por `updatePlatformMut.mutate({ id: cpId, updates: { phase: col.status } })`
- Já existe `const updatePlatformMut = useUpdateClientPlatform()` importado no componente

**3. Filtro de coluna: usar `cp.phase` em vez de `client.status`**
- Linha ~594: `filteredPlatformEntries.filter((e) => e.cp.phase === col.status)` em vez de `e.client.status === col.status`
- Linha ~440: filtro de status: `e.cp.phase === squadStatusFilter` em vez de `e.client.status`

**4. Nenhuma alteracao de banco necessaria** — o campo `phase` já existe em `client_platforms`.

