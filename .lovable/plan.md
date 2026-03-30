

## Fix: Filtro de Período no Dashboard Executivo

### Problema
Os `useMemo` de `clients`, `platforms` e `tasks` (linhas 180-208) não aplicam `filters.dateFrom`/`filters.dateTo`. Os valores mudam no state mas nunca filtram dados.

### Correção

**Arquivo: `src/pages/DashboardPage.tsx`**

1. **`clients` useMemo (linha 180)** — Adicionar filtro por `startDate`:
   - Se `c.startDate` existe, verificar se está dentro de `[dateFrom, dateTo]` usando `isWithinInterval`
   - Clientes sem `startDate` passam sem filtro de data

2. **`platforms` useMemo (linha 193)** — Adicionar filtro por `startDate` da plataforma:
   - Se `p.startDate` existe, verificar se está dentro do range

3. **`tasks` useMemo (linha 202)** — Adicionar filtro por `createdAt` OU `deadline`:
   - Tarefa entra se `createdAt` está no range OU `deadline` está no range

4. **Dados sem filtro de período** — Criar memos separados para:
   - **BLOCO 3 (Atrasos)**: Usar `allClients`/`allPlatforms`/`allTasks` filtrados apenas por squad/responsible (sem data), pois atrasos são em tempo real
   - **BLOCO 5 (Receita)**: MRR usa dados atuais sem filtro de data; "Clientes adicionados" e "Churn" usam `clients` filtrado por período

### Implementação concreta

- Adicionar 3 linhas de filtro de data nos 3 useMemo existentes
- Criar `unfilteredByDateClients`, `unfilteredByDatePlatforms`, `unfilteredByDateTasks` — mesmos filtros de squad/responsible/etc mas sem data — para uso nos blocos de Atraso
- No BLOCO 3, trocar referências de `clients`/`platforms`/`tasks` para as versões sem filtro de data
- No BLOCO 5, MRR usa dados sem filtro; contagens de período usam dados filtrados

### Arquivo alterado
- `src/pages/DashboardPage.tsx`

