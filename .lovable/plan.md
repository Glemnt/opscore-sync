

## Plan: Dashboard Overhaul + Platform Field on Client

### Summary of Changes

**Remove** from Dashboard stats: "Aguard. Cliente" and "Projetos em Andamento".

**Add** to Dashboard:
1. **Receita Recorrente Mensal (MRR)** — stat card summing all active clients' `monthlyRevenue`
2. **Clientes Adicionados** — stat card with count, plus date range filter (date pickers)
3. **Churn** — card showing churned clients count with date range filter
4. **Receita por Plataforma** — chart (pie or bar) breaking down revenue by platform (Mercado Livre, Shopee, Shein)

**Add `platform` field to Client model** — new field on the `Client` type for which marketplace the client pays on.

**Add platform selector to AddClientDialog** — dropdown with options: Mercado Livre, Shopee, Shein.

---

### Files to Change

#### 1. `src/types/index.ts`
- Add `Platform` type: `'mercado_livre' | 'shopee' | 'shein'`
- Add `platform: Platform` to `Client` interface

#### 2. `src/data/mockData.ts`
- Add `platform` field to each existing mock client (distribute across the 3 platforms)

#### 3. `src/components/AddClientDialog.tsx`
- Add a `platform` select field (Mercado Livre / Shopee / Shein) in the "Dados" tab
- Pass `platform` into the new `Client` object on submit

#### 4. `src/pages/DashboardPage.tsx`
- Remove "Projetos em Andamento" and "Aguard. Cliente" stat cards
- Add state for date filters (start/end date) using `Popover` + `Calendar`
- Add **MRR** stat card: sum of `monthlyRevenue` of active clients
- Add **Clientes Adicionados** card: count clients whose `startDate` falls within selected date range
- Add **Churn** card: count clients with `status === 'churned'` (filtered by date range)
- Add **Receita por Plataforma** chart: group active clients by `platform`, sum `monthlyRevenue` per platform, render as PieChart or BarChart
- Import `useClients` instead of raw mock data to get live client data including platform
- Use `date-fns` for date comparisons and `react-day-picker` Calendar for filters

#### 5. `src/contexts/ClientsContext.tsx`
- No structural changes needed — already exposes `clients` and `getVisibleClients`

