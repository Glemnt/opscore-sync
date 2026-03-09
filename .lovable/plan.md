

## Fix: Duplicated stages in Dashboard "Clientes por Etapa"

### Root cause

`DashboardPage.tsx` line 93 calls `useClientStatusesQuery()` without a board parameter, fetching statuses from **both** `clients` and `squads` boards. Since both boards now have identical keys (onboarding, reuniao_agendada, active, inativo), every stage appears twice.

### Fix

Change line 93 to filter by the `clients` board:

```tsx
const { data: clientStatuses = [] } = useClientStatusesQuery('clients');
```

This single-line change ensures the Dashboard only uses the `clients` board statuses, eliminating duplicates while keeping the churn detection and "Clientes por Etapa" section working correctly.

