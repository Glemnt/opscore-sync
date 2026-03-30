

## Fix: 4 Bugs Visuais Agrupados

### 1. Saúde do Cliente — labels truncados (`ClientDetailModal.tsx`, linha 1087)

Remover classe `truncate` e `w-28` do span do label. Usar `whitespace-nowrap` ou `shrink-0` para manter legível:

```
- <span className="text-[10px] text-muted-foreground w-28 truncate">
+ <span className="text-[10px] text-muted-foreground shrink-0">
```

### 2. Kanban — contador cortado (`TasksPage.tsx`, linhas 399-427)

O header usa `flex items-center justify-between` mas o container pai pode ter overflow hidden. Adicionar `whitespace-nowrap` no header div e `overflow-visible` ou `min-w-0` ajustado:

```
- 'flex items-center justify-between mb-3 pb-3 border-b-2 ...'
+ 'flex items-center justify-between mb-3 pb-3 border-b-2 whitespace-nowrap gap-2 ...'
```

E no badge de contagem (linha 426), adicionar `shrink-0`.

### 3. Checklist Onboarding — cabeçalhos truncados (`OnboardingChecklistPage.tsx`, linha 275-276)

Headers já têm `title` com tooltip. Problema é `max-w-[70px]` + `truncate`. Aumentar `max-w` e permitir quebra:

```
- <th ... className="px-1 py-1.5 text-center min-w-[60px] max-w-[70px]">
-   <span className="block truncate text-[10px] ...">
+ <th ... className="px-1 py-1.5 text-center min-w-[70px] max-w-[90px]">
+   <span className="block text-[10px] leading-tight break-words ...">
```

### 4. Catálogo de Plataformas — slug exposto (`PlatformCatalogPage.tsx`, linha 74)

Substituir slug por info útil:

```
- <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.slug}</p>
+ <p className="text-xs text-muted-foreground mt-0.5">Onboarding: {p.prazo_onboarding}d · Implementação: {p.prazo_implementacao}d</p>
```

### Arquivos alterados
- `src/components/ClientDetailModal.tsx`
- `src/pages/TasksPage.tsx`
- `src/pages/OnboardingChecklistPage.tsx`
- `src/pages/PlatformCatalogPage.tsx`

