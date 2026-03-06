

## Plano: Corrigir contagem de clientes ativos

### Problema
O subtitle da pagina Clientes filtra apenas `status === 'active'`, mas o usuario quer contar todos os clientes exceto os com status de "Churn" (`inativo` / `inactive`).

### Solucao

**1 arquivo: `src/pages/ClientsPage.tsx` — linha 101**

Alterar o filtro de:
```typescript
clients.filter((c) => c.status === 'active').length
```
Para:
```typescript
clients.filter((c) => c.status !== 'inactive').length
```

Isso contara todos os clientes que nao estao com status "Inativo" (Churn).

