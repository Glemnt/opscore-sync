

## Plano: Mostrar contagem de clientes ativos baseada no status do Kanban

### Problema
No card do squad, a linha 192 mostra `activeProjects` (projetos com status `in_progress`), mas o usuário quer ver o número de **clientes** cujo status corresponde à coluna "ativo" do Kanban.

### Solução
Substituir a contagem de `activeProjects` por uma contagem de clientes cujo `status` contém "active" (ou o equivalente dinâmico). Como os statuses são dinâmicos e vêm do banco (`client_statuses`), precisamos identificar quais statuses representam "ativo". A abordagem mais robusta é usar o label — qualquer status cujo label contenha "ativo" (case-insensitive) — similar ao padrão já usado para "churn" no dashboard.

### Alterações

**`src/pages/ProjectsPage.tsx`** (~linhas 151-192):
- Adicionar uma contagem de clientes ativos: filtrar `squadClients` cujo `status` corresponde a um `clientStatus` com label contendo "ativo" (case-insensitive)
- Substituir `activeProjects` por `activeClients` na exibição do card
- Alterar o texto de "X ativos" para "X clientes ativos"

Trecho resultante:
```typescript
const squadClients = clients.filter((c) => c.squadId === squad.id);
const activeStatusKeys = clientStatuses
  .filter(s => s.label.toLowerCase().includes('ativo') || s.key === 'active')
  .map(s => s.key);
const activeClients = squadClients.filter(c => activeStatusKeys.includes(c.status)).length;
```

E na renderização:
```tsx
<span className="font-medium">{squadClients.length} clientes</span>
<span>•</span>
<span className="text-primary font-semibold">{activeClients} ativos</span>
```

Nenhuma mudança de banco de dados.

