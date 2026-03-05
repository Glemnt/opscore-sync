

## Plano: Validar e corrigir drag-and-drop em todos os Kanbans

### Kanbans identificados

| Kanban | Local | Cards drag | Colunas drag | Status |
|--------|-------|------------|--------------|--------|
| Clientes (Squad) | ProjectsPage L527 | ✅ OK | ✅ OK | Funcionando |
| Plataformas | ProjectsPage L862 | ✅ OK (fix recente) | ✅ OK | Funcionando |
| Demandas (TasksPage) | TasksPage L260 | ✅ OK | ✅ OK | Funcionando |
| **Demandas (KanbanView dentro de plataforma)** | ProjectsPage L1507 | ⚠️ Parcial | ❌ Ausente | **Problemas** |

### Problemas encontrados no KanbanView (ProjectsPage, L1507)

**1. Container interno sem handlers de drop (L1546)**
A div interna que contém os cards NÃO tem `onDragOver` nem `onDrop`. Os outros Kanbans duplicam esses handlers na div interna para garantir que o drop funcione em áreas vazias e quando há overflow. Isso causa falhas de drop inconsistentes.

**2. Sem drag-and-drop de colunas**
O header das colunas (L1522) não é `draggable` e não há handlers de reordenação de colunas. Todos os outros Kanbans suportam arrastar colunas para reordená-las.

**3. Sem `onDragLeave` no container interno**
Falta limpar o estado `dragOverCol` ao sair da área de drop.

### Mudanças em `src/pages/ProjectsPage.tsx`

**1. Adicionar `onDragOver` e `onDrop` na div interna de cards (L1546):**
```tsx
<div className={cn(...)}
  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
  onDrop={(e) => { handleDrop(col.status, e); }}
>
```

**2. Adicionar estado e handlers para reordenação de colunas no KanbanView:**
- `draggingKanbanColId` e `kanbanColDropTarget` como estados locais
- Handler `onDragStart` no header da coluna (torná-lo `draggable`)
- Handlers `onDragOver`/`onDrop` para reordenar `cols` via `setCols`
- Visual indicator (barra lateral) quando arrastando coluna sobre outra

**3. Garantir estrutura flex correta para drop zones ocuparem toda a altura:**
- Adicionar `flex flex-col` na div da coluna e `flex-1` na div interna de cards

Mudanças concentradas no componente `KanbanView` (~30 linhas). Sem migração de banco.

