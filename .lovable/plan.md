

## Plano: Corrigir zona de drop do Kanban para toda a altura da coluna

### Diagnóstico

O problema persiste porque `flex-1` no container de cards só funciona se a cadeia de alturas estiver completa. Embora o layout tenha `h-screen` → `flex-1` (main) → `h-full flex flex-col` (page) → `flex-1` (kanban container), o `overflow-x-auto` no container do Kanban pode impedir que as colunas herdem a altura corretamente em todos os navegadores.

Além disso, os handlers `onDragOver`/`onDrop` estão apenas na div externa da coluna. A div interna dos cards (que tem `flex-1`) não captura eventos de drag, então se o browser não considerar a div interna como "alvo" quando está vazia, o drop pode falhar.

### Solução (duas camadas de correção)

**1. Garantir altura mínima visível no container de cards**

Substituir `min-h-[60px]` por `min-h-[calc(100vh-280px)]` (ou valor similar) para que a área de drop tenha altura visual garantida, independente de CSS flex.

**2. Duplicar handlers de drag na div interna dos cards**

Adicionar `onDragOver` e `onDrop` também na div interna que contém os cards, para que mesmo sem bubbling correto, o drop funcione.

### Alterações

**`src/pages/ProjectsPage.tsx`** (Kanban de clientes, ~linhas 432-435):
- Trocar `min-h-[60px]` por `min-h-[calc(100vh-280px)]`
- Adicionar `onDragOver` e `onDrop` idênticos aos da coluna pai

**`src/pages/TasksPage.tsx`** (Kanban de demandas, ~linhas 328-331):
- Trocar `min-h-[60px]` por `min-h-[calc(100vh-280px)]`
- Adicionar `onDragOver` e `onDrop` idênticos aos da coluna pai

Nenhuma mudança de banco de dados.

