

## Plano: Calcular `current_load` automaticamente com base nas tarefas ativas

### Abordagem

Em vez de depender do valor estático `current_load` salvo na tabela `team_members`, calcular dinamicamente no Dashboard a quantidade de tarefas ativas (status diferente de `done`) atribuídas a cada colaborador, usando o campo `responsible` da tabela `tasks`.

### Alteracoes

**1. `src/pages/DashboardPage.tsx`**

No bloco que renderiza a "Carga da Equipe", cruzar `tasks` com `teamMembers` para calcular a carga real:

- Criar um `useMemo` que conta tarefas ativas (status != `done`) agrupadas por `responsible` (nome do membro)
- Na renderizacao, usar esse valor calculado em vez de `member.currentLoad`

```tsx
const memberLoadMap = useMemo(() => {
  const map: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.status !== 'done' && t.responsible) {
      map[t.responsible] = (map[t.responsible] || 0) + 1;
    }
  });
  return map;
}, [tasks]);
```

Na renderizacao, substituir `member.currentLoad` por `memberLoadMap[member.name] || 0`.

**2. Nenhuma alteracao de banco necessaria** — o calculo sera feito no frontend com dados ja disponíveis.

