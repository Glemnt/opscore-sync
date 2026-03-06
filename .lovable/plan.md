

## Plano: Subtitle dinamico por etapa selecionada

### Alteracao

**1 arquivo: `src/pages/ClientsPage.tsx` — linha 101**

Alterar o subtitle para refletir o filtro de status selecionado:

```typescript
subtitle={
  statusFilter === 'all'
    ? `${clients.filter((c) => c.status !== 'inactive').length} clientes ativos`
    : `${filtered.length} clientes ativos em ${statusFilters.find(f => f.value === statusFilter)?.label ?? statusFilter}`
}
```

Quando "Todos" esta selecionado, mostra o total de clientes ativos. Quando uma etapa especifica e selecionada (Onboarding, Implementacao, etc.), mostra a contagem filtrada com o nome da etapa.

