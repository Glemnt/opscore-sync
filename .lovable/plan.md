

## Adicionar campo de clientes por etapa no Dashboard

### O que será feito
Adicionar um card no Dashboard que exibe a quantidade de clientes agrupados por status (etapa): Ativo, Onboarding, Pausado e Churned. Será um card visual com barras de progresso e contadores, posicionado logo após o resumo de saúde dos clientes.

### Alteração

**`src/pages/DashboardPage.tsx`**

1. Criar um `useMemo` que conta os clientes por status (`active`, `onboarding`, `paused`, `churned`) usando os dados já disponíveis no componente.

2. Inserir um novo card após o bloco "Saúde dos Clientes Ativos" (linha ~163) com:
   - Título "Clientes por Etapa"
   - Uma barra horizontal para cada status mostrando: ícone colorido, label (do `clientStatusConfig`), contagem e barra proporcional
   - Reutilizar as cores já definidas em `clientStatusConfig` de `src/lib/config.ts`

O layout será similar ao card de saúde, mantendo consistência visual com o restante do dashboard.

