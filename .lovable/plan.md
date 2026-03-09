

## Plano: Garantir coluna Inativo visível no Kanban de Squads

### Causa raiz

A detecção de status órfãos na linha 177 do `ProjectsPage.tsx` usa `clients.map(c => c.status)` — que verifica o status estratégico do **cliente**, não o `phase` da **plataforma**. No contexto do Kanban de Squads, as colunas representam fases de plataformas, então a detecção deveria usar `clientPlatformsData.map(cp => cp.phase)`.

Além disso, a coluna "Inativo" já existe no banco (`client_statuses` com board='squads'), então `baseCols` já a inclui. A coluna deveria renderizar mesmo sem cards — o código já suporta isso. Se não está aparecendo, pode ser um problema de timing com o `useEffect`.

### Alteração

**Arquivo:** `src/pages/ProjectsPage.tsx` (linhas 173-181)

Corrigir a detecção de órfãos para usar fases de plataformas em vez de status de clientes:

```tsx
useEffect(() => {
  if (clientStatuses.length > 0) {
    const baseCols = clientStatuses.map((s) => ({ id: s.key, label: s.label, status: s.key }));
    const knownKeys = new Set(baseCols.map(c => c.status));
    // Corrigido: usar phases de plataformas, não status de clientes
    const orphanStatuses = [...new Set(clientPlatformsData.map(cp => cp.phase))].filter(s => s && !knownKeys.has(s));
    const extraCols = orphanStatuses.map(s => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '), status: s }));
    setClientCols([...baseCols, ...extraCols]);
  }
}, [clientStatuses, clientStatusKey]);
```

Também atualizar a dependência do `useEffect` para incluir `clientPlatformsData` em vez de `clientStatusKey` (que é baseado em clientes):

```tsx
const platformPhaseKey = clientPlatformsData.map(cp => `${cp.id}:${cp.phase}`).sort().join(',');
```

Isso garante que:
1. Todas as colunas do DB (incluindo "Inativo") sempre aparecem — mesmo sem cards
2. Fases órfãs de plataformas são detectadas corretamente
3. A detecção de órfãos corresponde ao contexto de plataformas do Kanban de Squads

