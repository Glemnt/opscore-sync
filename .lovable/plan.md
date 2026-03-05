

## Plano: Corrigir loop infinito no useEffect da pagina Squads

### Problema raiz

O console mostra o erro **"Maximum update depth exceeded"** na `ProjectsPage.tsx`. O `useEffect` na linha 162 depende de `clients` (que vem de `getVisibleClients()`), mas `getVisibleClients()` retorna um novo array a cada render. Isso cria um ciclo infinito: `setClientCols` → re-render → novo array `clients` → `useEffect` dispara novamente → `setClientCols` → ...

Esse loop infinito pode causar o travamento da renderizacao do componente, impedindo que as plataformas aparecam corretamente no Kanban.

### Nota sobre dados

Os dados estao 100% sincronizados no banco — todos os clientes com plataformas configuradas possuem registros correspondentes em `client_platforms` com o `squad_id` correto. O problema e exclusivamente de renderizacao no frontend.

### Solucao

**1. `src/pages/ProjectsPage.tsx` — Corrigir dependencia do useEffect (~5 linhas)**

Substituir a dependencia `clients` por uma chave estavel derivada dos status dos clientes, evitando re-execucoes desnecessarias:

```typescript
// Criar uma chave estavel baseada nos status dos clientes
const clientStatusKey = clients.map(c => `${c.id}:${c.status}`).sort().join(',');

useEffect(() => {
  if (clientStatuses.length > 0) {
    const baseCols = clientStatuses.map((s) => ({ id: s.key, label: s.label, status: s.key }));
    const knownKeys = new Set(baseCols.map(c => c.status));
    const orphanStatuses = [...new Set(clients.map(c => c.status))].filter(s => !knownKeys.has(s));
    const extraCols = orphanStatuses.map(s => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '), status: s }));
    setClientCols([...baseCols, ...extraCols]);
  }
}, [clientStatuses, clientStatusKey]);
```

A variavel `clientStatusKey` so muda quando os status dos clientes realmente mudam, quebrando o ciclo infinito.

### Impacto
- 1 arquivo alterado (`ProjectsPage.tsx`, ~3 linhas)
- Corrige o loop infinito que impede a renderizacao correta
- Sem quebra de funcionalidade

