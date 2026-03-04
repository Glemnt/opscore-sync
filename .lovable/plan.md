

## Plano: Adicionar seletor de fase no dialog de geração de demandas

### Problema
O dialog recebe a `phase` como prop fixa (vinda da plataforma atual) e filtra os templates apenas para essa fase. O usuário fica preso na fase atual da plataforma (ex: "Pausado") e não consegue escolher outra fase para gerar demandas.

### Mudanças

**`src/components/GenerateDemandsDialog.tsx`**
- Adicionar um estado local `selectedPhase` inicializado com a prop `phase`
- Adicionar um `Select` no topo do dialog para escolher a fase desejada, usando `useClientStatusesQuery` para listar as opções da pipeline
- Alterar a filtragem de templates e o título para usar `selectedPhase` em vez da prop `phase`
- Ao criar as tarefas, usar `selectedPhase` como status da tarefa
- Importar `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`

### Resultado
O usuário poderá trocar a fase no dialog antes de gerar as demandas, vendo os templates correspondentes a qualquer fase da pipeline, sem ficar limitado à fase atual da plataforma.

