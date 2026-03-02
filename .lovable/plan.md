

## Corrigir métricas do Dashboard para excluir apenas clientes em status "Churn"

### Problema
As colunas do Kanban de Projetos foram renomeadas pelo usuário (ex: "Churned" virou "Performance"), mas as **keys** permanecem as mesmas (`churned`, `paused`, etc.). O Dashboard usa `status !== 'churned'` hardcoded para calcular MRR e clientes ativos, então clientes na coluna "Performance" (key=`churned`) são excluídos das métricas.

### Solução
Em vez de filtrar pelo key hardcoded `'churned'`, o Dashboard deve buscar os status cadastrados e identificar qual(is) têm o **label** contendo "churn" (case-insensitive). Apenas clientes nesses status serão excluídos das métricas.

### Alterações em `src/pages/DashboardPage.tsx`

1. Criar um `Set` de keys cujo label contenha "churn" (case-insensitive):
   ```ts
   const churnKeys = useMemo(() => {
     return new Set(
       clientStatuses
         .filter(s => s.label.toLowerCase().includes('churn'))
         .map(s => s.key)
     );
   }, [clientStatuses]);
   ```

2. Substituir todas as ocorrências de `c.status !== 'churned'` e `c.status === 'churned'` para usar `churnKeys`:
   - Linha 107: `activeClients` → `!churnKeys.has(c.status)`
   - Linha 115: `healthSummary` → `!churnKeys.has(c.status)`
   - Linha 137: `mrr` → `!churnKeys.has(c.status)`
   - Linha 152: `churnCount` → `churnKeys.has(c.status)`
   - Linha 163: `platformData` → `!churnKeys.has(c.status)`
   - Linha 189: `clientEvolutionData` → `churnKeys.has(c.status)`

Nenhuma alteração de banco de dados necessária.

