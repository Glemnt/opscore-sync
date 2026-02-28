

## Resumo visual de saúde dos clientes no Dashboard

### O que será feito
Adicionar um card no Dashboard mostrando a distribuição de saúde dos clientes ativos: quantos estão verdes, amarelos, vermelhos e não avaliados (branco).

### Localização
O card será inserido na primeira linha de stats do `DashboardPage.tsx`, substituindo o grid `grid-cols-2 lg:grid-cols-4` por `grid-cols-2 lg:grid-cols-5`, ou adicionando o card de saúde na seção de Churn (primeira coluna do grid de 3 colunas), reorganizando para melhor aproveitamento visual.

**Abordagem escolhida**: Adicionar uma nova row compacta logo abaixo dos stats cards com o resumo de saúde, usando 4 indicadores coloridos inline (verde, amarelo, vermelho, branco/não avaliado).

### Alteração

**`src/pages/DashboardPage.tsx`**:
1. Criar um `useMemo` que conta clientes ativos por `healthColor`:
   - `green` → "Saudável"
   - `yellow` → "Atenção"
   - `red` → "Crítico"
   - `white`/`null`/`undefined` → "Não avaliado"
2. Renderizar um card compacto com 4 indicadores coloridos (círculo + contagem + label), posicionado entre os stats cards e a seção de Churn/Receita por Plataforma.

### Detalhes técnicos
- Dados vêm de `clients` (já filtrado por visibilidade via `getVisibleClients()`)
- Filtrar apenas `status === 'active'`
- Campo `healthColor` do tipo `Client` já mapeado do banco (`health_color` enum: green, yellow, red, white)
- Nenhuma mudança no backend necessária

