

## Plano: Exibir tipo da demanda nos cards

### Problema
O `DemandCard` em `ProjectsPage.tsx` (usado no Kanban de squads) nao exibe o tipo da demanda. O `TaskCard` em `TasksPage.tsx` ja exibe corretamente com um badge colorido.

### Alteracao

**`src/pages/ProjectsPage.tsx` — componente `DemandCard` (~linha 1241)**
- Importar `useTaskTypesMap` de `@/hooks/useTaskTypesQuery`
- Dentro do `DemandCard`, obter `typeConf` a partir de `task.type` (mesmo padrao do `TaskCard`)
- Adicionar o badge colorido com o label do tipo logo abaixo do titulo, antes do responsavel:

```tsx
const taskTypeMap = useTaskTypesMap();
const typeConf = taskTypeMap[task.type] ?? { label: task.type, color: 'bg-gray-100 text-gray-700' };
```

```tsx
<span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', typeConf.color)}>
  {typeConf.label}
</span>
```

Nenhuma alteracao necessaria em `TasksPage.tsx` — ja possui o badge.

