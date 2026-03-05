

## Plano: Feedback visual aprimorado no drag-and-drop dos Kanbans

### Estado atual
Todos os Kanbans ja possuem feedback basico: `bg-primary/5 ring-2 ring-primary/20` na coluna de destino ao arrastar cards. No entanto, falta:
- Opacidade no card sendo arrastado
- Animacao de transicao suave ao soltar
- Indicador de "zona de drop" mais visivel (placeholder)
- Feedback visual no card arrastado (ghost melhorado)

### Mudancas

**1. CSS global (`src/index.css`) — adicionar classes de drag feedback:**
- `.dragging-card`: opacidade 50%, escala reduzida, sombra elevada
- `.drop-zone-active`: background animado com pulso suave, borda tracejada primaria
- `.card-dropped`: animacao `scale-in` + `fade-in` ao card recem-movido (via classe temporaria)

**2. Componente `DemandCard` (`ProjectsPage.tsx` L1645):**
- Adicionar classe `opacity-50 scale-95` durante `onDragStart`, remover em `onDragEnd`
- Ja possui `handleDragStart`; adicionar estado local ou ref para controlar classe

**3. Cards de cliente (`ProjectsPage.tsx` L626-634):**
- Adicionar `opacity-50 scale-95 rotate-1` ao card sendo arrastado (usar `draggingClientId` state que ja faz parte do dataTransfer, mas sem estado visual)
- Introduzir `draggingClientId` state para rastrear qual card esta sendo arrastado

**4. Cards de plataforma (`ProjectsPage.tsx` L968-977):**
- Ja tem `draggingPlatCardSlug`; adicionar classe condicional `opacity-50 scale-95` quando `draggingPlatCardSlug === slug`

**5. Colunas de destino — todos os Kanbans:**
- Trocar `bg-primary/5 ring-2 ring-primary/20` por feedback mais forte: `bg-primary/10 ring-2 ring-primary/40 shadow-inner` + transicao com `transition-all duration-200`
- Adicionar texto "Solte aqui" centralizado quando coluna esta vazia e recebendo drag

**6. Animacao pos-drop:**
- Adicionar classe CSS `animate-scale-in` temporariamente ao card apos ser movido (ja existe a animacao no tailwind config)

### Resumo de arquivos
- `src/index.css`: 2 novas classes utilitarias
- `src/pages/ProjectsPage.tsx`: ~15 linhas (estados + classes condicionais em 3 Kanbans)
- `src/pages/TasksPage.tsx`: ~5 linhas (classe condicional no card + coluna)

Sem migracao de banco.

