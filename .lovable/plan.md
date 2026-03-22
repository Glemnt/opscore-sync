

## Plano: Corrigir Fluxo de Demandas (Reset de Responsavel + Tela Branca)

### Problema

Dois bugs criticos no fluxo de demandas:
1. Ao selecionar responsavel no template SARRAMA Shopee, o formulario reseta e perde todos os dados preenchidos
2. Ao criar demandas em outras plataformas, tela branca

### Causa raiz

**Bug 1 — Reset do formulario ao selecionar responsavel:**

Em `GenerateDemandsDialog.tsx`, linhas 64-96, o `useEffect` que expande templates em rows depende de `phaseTemplates` e `flows`:

```tsx
useEffect(() => {
  const expanded: DemandRow[] = [];
  for (const t of phaseTemplates) { ... }
  setRows(expanded); // RESETA TUDO
}, [phaseTemplates, flows]);
```

`phaseTemplates` e um `useMemo` que depende de `templates` (vindo do react-query). Quando o usuario interage com o Select de responsavel, o react-query pode disparar um refetch (ex: window focus, stale time). Quando `templates` refetcha, a referencia do array muda, `phaseTemplates` recalcula (nova referencia mesmo com mesmos dados), o useEffect dispara e **reseta todas as rows**, apagando responsavel e deadline ja preenchidos.

O mesmo acontece com `flows` — qualquer refetch dispara o reset.

**Bug 2 — Tela branca em outras plataformas:**

Quando o usuario navega para o detalhe de uma plataforma via `onViewDemands` (PlatformDetailModal), o codigo seta `selectedClient` e `selectedPlatform`. Se a plataforma nao existe no array `selectedClient.platforms` ou se `clientPlatformsData` ainda nao carregou, o componente pode crashar silenciosamente.

### Solucao

#### 1. Estabilizar rows no GenerateDemandsDialog

Substituir o `useEffect` que reseta rows por logica que so recalcula quando a fase muda (nao quando dados refetcham):

- Usar uma ref para rastrear a fase anterior
- So resetar rows quando `selectedPhase` realmente mudar
- Memoizar `phaseTemplates` com comparacao estavel (por IDs, nao por referencia)

```tsx
// Usar ref para detectar mudanca real de fase
const prevPhaseRef = useRef(selectedPhase);

useEffect(() => {
  // So recalcular se a fase mudou de verdade
  if (prevPhaseRef.current === selectedPhase && rows.length > 0) return;
  prevPhaseRef.current = selectedPhase;
  
  const expanded: DemandRow[] = [];
  // ... mesmo codigo de expansao
  setRows(expanded);
}, [selectedPhase, templates, flows]);
```

#### 2. Proteger contra perda de dados no updateRow

Garantir que `updateRow` nao e afetada por re-renders:

```tsx
const updateRow = useCallback((idx: number, patch: Partial<DemandRow>) => {
  setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
}, []);
```

#### 3. Wrap GenerateDemandsDialog com Error Boundary

Adicionar try-catch no render e proteger contra crash silencioso que leva a tela branca.

#### 4. Proteger navegacao para detalhe de plataforma

Em `ProjectsPage.tsx`, no handler `onViewDemands`, validar que a plataforma existe antes de navegar:

```tsx
onViewDemands={() => {
  if (expandedPlatformEntry?.client && expandedPlatformEntry?.cp?.platformSlug) {
    setSelectedClient(expandedPlatformEntry.client);
    setSelectedPlatform(expandedPlatformEntry.cp.platformSlug);
  }
  setExpandedPlatformEntry(null);
}}
```

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/components/GenerateDemandsDialog.tsx` | Estabilizar useEffect de rows para nao resetar ao refetch; useCallback no updateRow |
| `src/pages/ProjectsPage.tsx` | Validar dados antes de navegar no onViewDemands |

