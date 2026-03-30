

## Fix: Pontualidade Média incompatível com Tarefas Atrasadas

### Problema
Linha 68: quando `completed.length === 0`, `onTimePct` retorna 100% por default. Com 247 tarefas atrasadas e 0 concluídas, exibe "100% pontualidade" — logicamente impossível.

Linha 154: `avgOnTime` é média simples dos `onTimePct` individuais, propagando o mesmo bug.

### Correção em `src/pages/ProductivityPage.tsx`

**1. Fórmula de `onTimePct` por membro (linha 68)**

Mudar de `completed / completed` para considerar atrasadas abertas:

```
denominador = completed.length + late.length
onTimePct = denominador > 0 ? Math.round((onTime.length / denominador) * 100) : null
```

- `null` = sem dados (nem concluídas nem atrasadas)
- 0 concluídas + 247 atrasadas → 0%
- 5 no prazo + 0 atrasadas → 100%

**2. Adicionar `deliveryRate` por membro (novo campo)**

```
deliveryRate = (completed + late) > 0 ? Math.round(completed / (completed + late) * 100) : null
```

Taxa de Entrega: quantas foram finalizadas vs total pendente+finalizado.

**3. KPI `avgOnTime` no topo (linha 154)**

Recalcular com totais globais em vez de média de percentuais:

```
totalOnTime = soma de onTime de todos os membros
totalDenominator = totalCompleted + totalLate
avgOnTime = totalDenominator > 0 ? Math.round((totalOnTime / totalDenominator) * 100) : null
```

Exibir "—" quando `null`.

**4. Tabela ranking (onde exibe `onTimePct`)**

Se `onTimePct === null`, mostrar "—" em vez de número.

**5. Novo KPI card "Taxa de Entrega"**

Adicionar card ao lado de Pontualidade mostrando `deliveryRate` global.

### Arquivo
- `src/pages/ProductivityPage.tsx`

