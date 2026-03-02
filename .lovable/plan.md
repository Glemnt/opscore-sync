

## Adicionar filtro por plataforma na página de Demandas

### Contexto
A página de Demandas (`TasksPage.tsx`) já possui filtros por responsável e por tipo. As tarefas já têm o campo `platforms` (array de slugs). O hook `usePlatformsQuery` já existe e retorna as plataformas do banco.

### Alterações

**`src/pages/TasksPage.tsx`**
- Adicionar um novo estado `selectedPlatform` (default `'all'`)
- Construir a lista de plataformas disponíveis a partir de `usePlatformsQuery`
- Adicionar um `<select>` ao lado dos filtros existentes com as opções de plataforma
- Atualizar a lógica de `filtered` para incluir `matchPlatform`: verificar se `task.platforms` contém o slug selecionado (ou passar tudo se `'all'`)

### Detalhes técnicos
- A filtragem usa `task.platforms` (array de slugs) comparado com o slug da plataforma selecionada
- O select lista `platforms` do hook existente `usePlatformsQuery`
- Padrão igual aos filtros já existentes de responsável e tipo

