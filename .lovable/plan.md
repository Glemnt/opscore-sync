

## Plano: Corrigir drag-and-drop dos cards de plataforma no Kanban

### Problema identificado
O card de plataforma tem um handler `onClick={() => setSelectedPlatform(slug)}` (linha 977) que navega para a visao detalhada da plataforma. Quando o usuario solta o card apos arrastar, o evento `click` pode disparar antes ou junto com o `drop`, fazendo a pagina trocar de visao e impedindo que o drop funcione corretamente. Alem disso, falta `e.stopPropagation()` nos handlers de drop internos, causando dupla execucao.

### Mudancas em `src/pages/ProjectsPage.tsx`

**1. Evitar que `onClick` dispare durante drag:**
- No `onDragStart` do card, setar um flag (`setDraggingPlatCardSlug` ja existe)
- No `onClick`, verificar se `draggingPlatCardSlug` esta ativo e ignorar o click nesse caso
- Usar um ref `wasDraggingRef` para capturar o estado entre `onDragEnd` e `onClick` (ambos disparam no mesmo ciclo)

Substituir linha 977:
```typescript
onClick={() => setSelectedPlatform(slug)}
```
Por:
```typescript
onClick={() => {
  if (wasDraggingPlatRef.current) {
    wasDraggingPlatRef.current = false;
    return;
  }
  setSelectedPlatform(slug);
}}
```

E no `onDragStart` (linha 971-975), adicionar `e.stopPropagation()`. No `onDragEnd` (linha 976), setar `wasDraggingPlatRef.current = true`.

**2. Adicionar `e.stopPropagation()` no drop handler interno** (linha 926):
- Evitar que o evento de drop do container de cards buble para o container da coluna, prevenindo dupla execucao de `handlePlatCardDrop`

**3. Adicionar ref `wasDraggingPlatRef`:**
- `const wasDraggingPlatRef = useRef(false)` no inicio do componente

Mudanca de ~10 linhas, sem migracao de banco.

