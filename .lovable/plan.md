

## Exibir observação no card de demanda da página Squads

### Problema
O componente `DemandCard` em `ProjectsPage.tsx` (página Squads) não exibe o campo `task.comments` (observação). Na página Demandas (`TasksPage.tsx`), o card já exibe a observação com ícone `MessageSquare` — mas o `DemandCard` da página Squads não tem essa seção.

### Alteração

**`src/pages/ProjectsPage.tsx`** — componente `DemandCard` (linha 655, após o bloco de subtarefas)

Adicionar o mesmo bloco de exibição de comentários usado na `TasksPage`:

```tsx
{task.comments && (
  <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-2">
    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
    <span className="line-clamp-2">{task.comments}</span>
  </div>
)}
```

Também importar `MessageSquare` do lucide-react (já importado parcialmente no arquivo).

