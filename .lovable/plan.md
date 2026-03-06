

## Plano: Corrigir exclusao de colunas no Kanban de Squads

### Problema raiz

Ao excluir uma coluna do Kanban (ex: "Onboarding"), o registro e deletado da tabela `client_statuses` com sucesso. Porem, os clientes que possuem `status = 'onboarding'` continuam com esse valor. O `useEffect` detecta esse status como "orfao" e recria a coluna automaticamente — fazendo parecer que a exclusao nao funcionou.

### Solucao

Na funcao `confirmRemoveCol` (~linha 340), alem de deletar o status do banco, tambem reassinar todos os clientes daquela coluna para o primeiro status valido restante. Isso se aplica tanto para colunas do banco quanto para orfas:

**Arquivo: `src/pages/ProjectsPage.tsx`**

```typescript
const confirmRemoveCol = () => {
  if (deleteColConfirm) {
    const isOrphan = !clientStatuses.find(s => s.key === deleteColConfirm.status);
    // Determine first valid status (excluding the one being deleted)
    const firstValid = clientStatuses.find(s => s.key !== deleteColConfirm.status)?.key ?? 'active';
    
    // Always reassign clients with this status
    squadClients
      .filter(c => c.status === deleteColConfirm.status)
      .forEach(c => updateClient(c.id, { status: firstValid }));
    
    // If it's a DB status, also delete the record
    if (!isOrphan) {
      deleteStatusMut.mutate(deleteColConfirm.status);
    }
    
    setDeleteColConfirm(null);
  }
};
```

### Impacto
- 1 arquivo alterado, ~10 linhas modificadas
- Clientes sao movidos para outra coluna antes da exclusao, impedindo a recriacao da coluna como orfao

