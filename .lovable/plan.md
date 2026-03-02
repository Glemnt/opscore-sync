

## Correção: Clientes Ativos e MRR no Dashboard

### Problema
Atualmente, o contador de "Clientes Ativos" filtra apenas `status === 'active'`, excluindo clientes com status `paused` ou `onboarding`. O MRR já está correto (exclui apenas `churned`), mas o contador de clientes ativos e o resumo de saúde precisam seguir a mesma lógica: **só excluir clientes com status `churned`**.

### Alterações

**`src/pages/DashboardPage.tsx`**

1. **Linha 105** — Contador de clientes ativos: trocar `c.status === 'active'` por `c.status !== 'churned'`
2. **Linha 113** — Health summary: trocar `c.status === 'active'` por `c.status !== 'churned'` para que clientes `paused` e `onboarding` também apareçam no resumo de saúde

Isso garante que apenas clientes em churn sejam removidos das métricas do dashboard.

