

## Plano: Reorganizar filtros na pagina Squads (Step 2 - Clientes do Squad)

### Layout proposto

```text
Linha 1: [Barra de Busca]  [Responsavel v] [Squad v] [Saude v] [Data v] [Plataforma v]
Linha 2: [Todos] [Onboarding] [Ativo] [Inativo] [+ custom statuses...] [+]
```

### Mudancas em `src/pages/ProjectsPage.tsx`

**1. Novos estados de filtro (dentro do bloco `if (!selectedClient)`):**
- `statusFilter` (string, default `'all'`) — para a pipeline
- `responsibleFilter` (string, default `'all'`)
- `healthFilter` (string, default `'all'`)
- `platformFilter` (string, default `'all'`)
- `dateFrom` / `dateTo` (string, default `''`)

Obs: O filtro de "Squad" nao se aplica aqui pois ja estamos dentro de um squad selecionado. Caso o usuario queira, posso manter como um filtro que permite trocar de squad rapidamente, mas o contexto atual ja filtra por squad.

**2. Atualizar logica de filtragem (`filteredSquadClients`):**
- Adicionar `matchStatus`, `matchResponsible`, `matchHealth`, `matchPlatform`, `matchDate` alem do `matchSearch` existente
- `matchPlatform`: verifica se `client.platforms?.includes(platformFilter)`
- `matchHealth`: verifica `client.healthColor === healthFilter`
- `matchResponsible`: verifica `client.responsible === responsibleFilter`

**3. Extrair listas unicas para os selects:**
- Responsaveis: `[...new Set(squadClients.map(c => c.responsible).filter(Boolean))]`
- Plataformas: usar `platformOptions` ja carregado

**4. Reorganizar JSX dos filtros em 2 linhas:**

**Linha 1**: Search bar (`flex-1 max-w-sm`) + selects compactos de Responsavel, Saude (green/yellow/red/white), Data (date range), Plataforma — alinhados a direita com `flex items-center gap-3`

**Linha 2**: Pipeline de status como tabs/botoes horizontais (Todos + statuses do banco `clientCols`) — permite filtrar os cards do Kanban por status OU mostrar todos. Inclui botao `+` para adicionar novo status.

**5. Comportamento do filtro de status vs Kanban:**
- Quando `statusFilter === 'all'`: mostra o Kanban completo com todas as colunas (comportamento atual)
- Quando um status especifico e selecionado: mostra apenas a coluna correspondente no Kanban

Nenhuma migracao de banco necessaria.

