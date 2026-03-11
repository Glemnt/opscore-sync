

## Plano: Trocar Kanban por filtro de fases na página de Squads

### Contexto
Atualmente a página de Squads exibe os cards de plataformas em colunas Kanban (uma coluna por fase). O usuário quer substituir isso por um filtro horizontal de abas (como na página de Clientes), mostrando os cards em grid.

### Alterações em `src/pages/ProjectsPage.tsx`

**1. Adicionar abas de fase na Row 2 (linhas ~552-593)**
Replicar o padrão da ClientsPage: uma barra horizontal com botões "Todos", "Onboarding", "Reunião Agendada", "Ativo", "Inativo" (vindos de `clientStatuses`), com botão de excluir em hover e botão "+" para adicionar.

**2. Substituir o Kanban por um Grid (linhas ~595-860)**
- Remover o layout de colunas horizontais com scroll (`flex gap-4 h-[calc...] overflow-x-auto`)
- Substituir por um `grid grid-cols-3 gap-4` que renderiza todos os `filteredPlatformEntries` filtrados pelo `squadStatusFilter`
- O filtro `squadStatusFilter` já existe e já filtra por fase — a lógica de filtragem em `filteredPlatformEntries` (linha 441-453) não precisa mudar
- Remover `visibleCols` (linha 455) — não será mais necessário

**3. Remover lógica de drag-and-drop de colunas**
- Remover handlers de drag de colunas (`handleClientColDragStart`, `handleClientColDragOver`, `handleClientColDrop`, `handleClientColDragEnd` — linhas 391-428)
- Remover estados de drag de colunas (`draggingClientColId`, `clientColDropTarget`, `dragOverClientCol`, `editingColId` — linhas 185-188)
- Manter o drag-and-drop de cards para permitir mover plataformas entre fases via drop (opcional — pode ser removido se não fizer sentido sem colunas)

**4. Manter funcionalidades existentes**
- Manter diálogos de adicionar/remover coluna de status (renomeados conceitualmente para "fase")
- Manter todos os filtros da Row 1 (busca, responsável, saúde, plataforma, tipo cliente, prioridade, datas)
- Manter o click no card para abrir `PlatformDetailModal`

### Layout resultante
```text
┌──────────────────────────────────────────────┐
│ [Squad Name]          [Voltar] [Nova Plataf.] │
│                                               │
│ [🔍 Buscar] [Responsável▾] [Saúde▾] ...      │
│                                               │
│ [Todos] [Onboarding] [Ativo] [Inativo] [+]   │
│                                               │
│ ┌────────┐ ┌────────┐ ┌────────┐             │
│ │ Card 1 │ │ Card 2 │ │ Card 3 │             │
│ └────────┘ └────────┘ └────────┘             │
│ ┌────────┐ ┌────────┐                         │
│ │ Card 4 │ │ Card 5 │                         │
│ └────────┘ └────────┘                         │
└──────────────────────────────────────────────┘
```

Sem alterações no banco de dados.

