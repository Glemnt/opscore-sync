

## Corrigir contabilização de receita no Dashboard

### Problema
O Dashboard filtra MRR e receita por plataforma apenas por clientes com status `active`. Quando um cliente muda para `paused` ou `onboarding`, sua receita deixa de ser contabilizada. O correto é excluir a receita **apenas** de clientes com status `churned`.

### Alterações

**`src/pages/DashboardPage.tsx`** — 3 pontos de mudança:

1. **MRR (linha 125)**: Trocar `c.status === 'active'` por `c.status !== 'churned'`
2. **Receita por Plataforma (linha 151)**: Mesmo ajuste — `c.status !== 'churned'`
3. **Saúde dos Clientes (linha 113)**: Manter filtrando por `active` aqui, pois saúde é apenas para clientes ativos — ou ajustar para incluir todos exceto churned, conforme preferência. Sem alteração proposta neste item.

Nenhuma mudança no banco de dados.

