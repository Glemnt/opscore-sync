

## Plano: Ajustes de Faturamento, Etapa e Responsável

### 1. Restringir faturamento para admin apenas

O acesso admin é controlado por `currentUser.accessLevel === 3`. Vou usar isso para ocultar dados financeiros em toda a UI.

**Arquivos afetados:**

- **`src/pages/DashboardPage.tsx`**: Importar `useAuth`, obter `currentUser`. Condicionar a exibição do card MRR (linhas 230-235), do gráfico "Receita por Plataforma" (linhas 309-336). Para non-admin, ocultar completamente esses componentes.

- **`src/pages/ClientsPage.tsx`**: Importar `useAuth`. No grid de métricas do card (linhas 416-427), ocultar as colunas "Mensalidade" e "Setup" para non-admin, ajustando `grid-cols-5` para `grid-cols-3`.

- **`src/components/ClientDetailModal.tsx`**: Importar `useAuth`. Ocultar campos "Mensalidade", "Setup Pago" no formulário de edição (linhas 362-368) e na visualização ReadOnlyField (linha 466) para non-admin.

- **`src/components/EditPlatformDialog.tsx`**: Se houver campos financeiros visíveis, ocultar para non-admin.

- **`src/components/AddPlatformSquadDialog.tsx`**: O campo "Faturamento" (revenue tier, linha 258) -- ocultar para non-admin.

- **`src/pages/ReportsPage.tsx`**: Verificar e ocultar dados financeiros para non-admin.

### 2. Adicionar campo de etapa da plataforma

O campo `phase` já existe na tabela `client_platforms` com valores como `onboarding`. Vou expandir as opções para incluir as 4 etapas solicitadas.

**Alterações:**

- **`src/pages/ProjectsPage.tsx`** (linha 388-394): Atualizar `phaseLabels` para usar as novas etapas:
  ```
  onboarding: 'On-board'
  implementacao: 'Implementação'
  performance: 'Performance'
  escala: 'Escala'
  ```
  Remover `active` e `inativo` (esses são status, não etapas).

- **`src/components/EditPlatformDialog.tsx`** (linhas 197-201): A "Fase" do cliente (onboarding/reuniao_agendada) é do nível do cliente. Vou adicionar um campo separado de "Etapa da Plataforma" na seção "Dados da Plataforma" com as opções On-board, Implementação, Performance, Escala, que atualiza `cp.phase`.

- **Cards na ProjectsPage** (linha 659): Já exibe `cp.phase` capitalizado. Vai refletir automaticamente.

- **Filtro de fase nas abas** (ProjectsPage): Já filtra por `cp.phase`. As abas dinâmicas via `platform_phase_statuses` já permitem configurar. Garantir que as 4 etapas apareçam como opções.

### 3. Remover responsável da aba Clientes

Já foi feito na iteração anterior. Vou verificar que não restam vestígios.

- **`src/pages/ClientsPage.tsx`**: O badge de responsável já foi removido do card. O filtro já usa `allClientPlatforms`. Confirmado.

### 4. Filtro por responsável só do card da plataforma

Já implementado na iteração anterior. O `uniqueResponsibles` e `matchResponsible` em ambas as páginas já usam apenas `cp.responsible`. Confirmado.

### 5. Contagem de plataformas por responsável

Adicionar ao dropdown de responsável no filtro das Squads um indicador de contagem:

- **`src/pages/ProjectsPage.tsx`**: No select de responsável, mostrar `"Leonardo (3)"` ao lado de cada opção, contando quantas plataformas cada um gerencia no squad.

- **`src/pages/ClientsPage.tsx`**: Similarmente, mostrar contagem no dropdown de responsável.

### Resumo de arquivos a editar

1. `src/pages/DashboardPage.tsx` -- ocultar MRR e receita por plataforma para non-admin
2. `src/pages/ClientsPage.tsx` -- ocultar Mensalidade/Setup no card para non-admin; contagem no dropdown responsável
3. `src/components/ClientDetailModal.tsx` -- ocultar campos financeiros para non-admin
4. `src/components/AddPlatformSquadDialog.tsx` -- ocultar faturamento para non-admin
5. `src/components/EditPlatformDialog.tsx` -- adicionar campo de etapa da plataforma; ocultar campos financeiros para non-admin
6. `src/pages/ProjectsPage.tsx` -- atualizar phaseLabels; contagem no dropdown responsável
7. `src/pages/ReportsPage.tsx` -- ocultar dados financeiros para non-admin

Sem alterações de banco de dados necessárias. O campo `phase` em `client_platforms` já suporta texto livre.

