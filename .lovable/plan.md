

## Plano: Kanban por Fase Operacional nos Squads

### Problema identificado

A visualização do squad usa `client_statuses` (board='squads') como fonte das abas de filtro, que tem apenas 3 entradas: `onboarding`, `active`, `inativo`. Porém os cards de plataforma usam o campo `phase` que contém valores como `onboarding`, `implementacao`, `active`, `performance`, `escala`. A correspondencia falha porque as chaves nao batem — por exemplo, `onboarding` no card deveria aparecer na aba `onboarding`, mas a logica de orphan detection nem sempre resolve.

Alem disso, a estrutura atual e um grid com filtro por abas, nao um Kanban com colunas separadas.

### Causa raiz do bug

O squad usa `clientStatuses` (tabela `client_statuses`, board='squads') que tem chaves `onboarding`, `active`, `inativo`. Mas os cards salvam phases como `onboarding`, `implementacao`, `active`, `performance`, `escala`. O sistema de orphan detection tenta criar colunas extras, mas a logica de filtro `e.cp.phase === col.status` depende de um match exato que nem sempre acontece.

### Solucao

1. **Trocar a fonte de colunas**: Em vez de usar `client_statuses` (board='squads'), usar `platform_phase_statuses` como fonte das colunas do Kanban, pois esta tabela reflete as fases operacionais reais dos cards.

2. **Transformar o grid em Kanban**: Substituir o layout `grid grid-cols-3` por um layout horizontal de colunas Kanban (`flex overflow-x-auto`), onde cada coluna corresponde a uma fase.

3. **Manter filtros como filtros secundarios**: Os dropdowns de busca, responsavel, saude, plataforma, tipo e prioridade continuam como filtros, mas a barra de abas de fase e substituida pelas colunas do Kanban.

4. **Drag-and-drop entre colunas**: Ao arrastar um card de uma coluna para outra, atualizar o campo `phase` na tabela `client_platforms`.

5. **Contagem por coluna**: Cada header de coluna mostra `Fase (N)`.

### Alteracoes em `src/pages/ProjectsPage.tsx`

| Trecho | O que muda |
|---|---|
| Fonte de colunas (useEffect linhas 182-191) | Usar `platformPhaseStatuses` em vez de `clientStatuses` para montar as colunas, adicionando uma coluna "Ativo" (key `active`) que existe nos dados mas nao em `platform_phase_statuses` |
| Barra de abas de fase (linhas 586-621) | Remover completamente — as fases viram colunas do Kanban |
| Grid de cards (linhas 626-753) | Substituir por layout Kanban horizontal com colunas por fase, cada coluna listando os cards cujo `cp.phase` coincide |
| Filtro `squadStatusFilter` | Remover — nao e mais necessario pois as fases sao colunas, nao filtros |
| Drag-and-drop | Adicionar handlers para arrastar cards entre colunas e atualizar `phase` via `updatePlatformMut` |
| Orphan detection | Manter para phases presentes nos dados mas ausentes na config |

### Colunas iniciais

Baseado nos dados existentes na tabela `platform_phase_statuses` + dados reais:
- **Onboarding** (key: `onboarding`)
- **Implementacao** (key: `implementacao`)  
- **Ativo** (key: `active`) — existe nos dados mas nao na tabela `platform_phase_statuses`, sera adicionado como orphan ou via migracao
- **Performance** (key: `performance`)
- **Escala** (key: `escala`)

### Migracao de banco

Adicionar a fase `active` (Ativo) na tabela `platform_phase_statuses` para que ela apareca como coluna formal:

```sql
INSERT INTO platform_phase_statuses (key, label, sort_order)
VALUES ('active', 'Ativo', 1)
ON CONFLICT DO NOTHING;
```

Tambem adicionar `inativo` caso exista nos dados:

```sql
INSERT INTO platform_phase_statuses (key, label, sort_order)
VALUES ('inativo', 'Inativo', 5)
ON CONFLICT DO NOTHING;
```

### Arquivos alterados

- `src/pages/ProjectsPage.tsx` — refatoracao principal do layout de squad
- Migracao SQL — adicionar fases faltantes em `platform_phase_statuses`

