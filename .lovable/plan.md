

## Plano: Corrigir bug visual do calendário no modal do cliente

### Problema
O `DialogContent` no `ClientDetailModal` usa `overflow-y-auto` (linha 363), o que faz com que o popover do calendário (usado no campo "Entrada") e outros elementos flutuantes sejam cortados visualmente quando o modal precisa de scroll. O `overflow-y-auto` cria um novo contexto de empilhamento que impede elementos com portal de renderizarem corretamente em relação ao scroll container.

### Solução

**Arquivo: `src/components/ClientDetailModal.tsx`**

1. No `PopoverContent` do campo `startDate` (linha 304), adicionar `sideOffset` adequado e garantir que o popover use `position: "popper"` com `avoidCollisions`
2. Alternativamente, trocar a abordagem: em vez de `Popover` dentro do dialog scrollável, usar `overflow-visible` no container pai e controlar o scroll de forma diferente, ou mover o calendário para fora do fluxo de scroll

A correção mais limpa é ajustar o `PopoverContent` para ter `side="bottom"` e `avoidCollisions={true}`, e adicionar `style={{ zIndex: 9999 }}` para garantir que fique acima do dialog overlay. Também vou verificar se o `overflow-y-auto` na `DialogContent` precisa de `overflow-x-visible` ou se o melhor caminho é envolver o conteúdo scrollável num div interno, deixando o `DialogContent` sem overflow clip.

**Mudança concreta:**
- Linha 363: mover o `overflow-y-auto` para um `<div>` wrapper interno em vez de no `DialogContent` raiz, evitando que o container com z-50 do dialog clippe os portais
- Garantir que o `PopoverContent` do calendário tenha `z-[9999]` (já tem) e `pointer-events-auto` no Calendar (já tem)

Isso resolve o clipping do calendário sem afetar o scroll do modal.

