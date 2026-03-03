

## Plano: Expandir zona de drop do Kanban para toda a altura da coluna

### Problema
As colunas do Kanban têm `min-h-[60px]` na área de cards, mas não se estendem até o final da tela. Quando o usuário arrasta um card para uma posição abaixo dos cards existentes (numa área vazia), o drop não é registrado porque a div interna com os cards não cobre toda a altura.

### Solução
Fazer a div interna de cards (`space-y-3 min-h-[60px]`) ocupar toda a altura disponível da coluna com `flex-1`, e garantir que a coluna pai use `flex flex-col` com altura total.

### Alterações

**Arquivo: `src/pages/ProjectsPage.tsx`**
- Linha 367-371: Adicionar `flex flex-col` à div da coluna do Kanban de clientes
- Linha 432-434: Adicionar `flex-1` à div interna que contém os cards de clientes

**Arquivo: `src/pages/TasksPage.tsx`**
- Linha 262-266: Adicionar `flex flex-col` à div da coluna do Kanban de demandas
- Linha 328-330: Adicionar `flex-1` à div interna que contém os cards de demandas

Ambas as mudanças garantem que a zona de drop se estenda por toda a altura visível da coluna, permitindo soltar o card em qualquer posição vertical.

