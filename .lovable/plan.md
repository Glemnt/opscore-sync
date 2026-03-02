

## Adicionar filtros de Data e Etapa na página de Demandas

### Alterações em `src/pages/TasksPage.tsx`

**1. Novos estados de filtro**
- `selectedStatus`: string (`'all'` ou a key do status) para filtrar por etapa/coluna
- `dateFrom` e `dateTo`: strings opcionais para filtro por intervalo de data (deadline)

**2. UI dos filtros** (ao lado dos filtros existentes de tipo e plataforma)
- **Filtro por Etapa**: `<select>` com opção "Todas etapas" + lista dinâmica vinda de `taskStatuses`
- **Filtro por Data**: dois inputs `type="date"` (De / Até) para filtrar pelo campo `deadline` das tarefas

**3. Lógica de filtragem** (adicionar ao bloco `filtered`)
- `matchStatus`: `selectedStatus === 'all' || t.status === selectedStatus`
- `matchDate`: se `dateFrom` definido, `t.deadline >= dateFrom`; se `dateTo` definido, `t.deadline <= dateTo`

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/TasksPage.tsx` | Adicionar estados, selects e lógica de filtro por etapa e data |

