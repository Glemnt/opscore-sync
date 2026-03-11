

## Plano: Replicar estrutura de abas da página Clientes na página Squads

### Alteração em `src/pages/ProjectsPage.tsx` (linhas 511-553)

Substituir o bloco atual de filtro de fases pelo mesmo padrão visual da ClientsPage:

- Container: `flex items-center gap-1.5 bg-card border border-border rounded-lg p-1 mb-5` (em vez de `flex flex-wrap items-center gap-2 mb-4`)
- Botões: `px-3 py-1.5 rounded-md text-xs font-medium` (em vez de `rounded-lg text-sm border`)
- Ativo: `bg-primary text-primary-foreground shadow-sm` (sem border explícito)
- Inativo: `text-muted-foreground hover:text-foreground hover:bg-muted` (sem border/bg-card)
- Botão de excluir: usar `ml-0.5 p-0.5 rounded ... opacity-0 group-hover:opacity-100` inline ao lado do label (em vez de posição absoluta `-top-1.5 -right-1.5`)
- Botão "+": `px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-primary/10` (sem border dashed)

Sem alterações de lógica ou banco de dados.

