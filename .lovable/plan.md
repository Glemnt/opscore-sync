

## Plano: Área de drop ocupa toda a altura restante da tela

### Diagnóstico

O `main` no Layout tem `overflow-y-auto`, o que quebra a cadeia de `flex-1` / `h-full` — o conteúdo pode crescer além do viewport sem que o flex constrainja a altura. Por isso, `flex-1` na div interna dos cards não estica até o fundo da tela.

O `min-h-[calc(100vh-280px)]` é estático e não se adapta ao conteúdo real acima do Kanban.

### Solução

Usar uma abordagem que **force as colunas a ocuparem toda a altura restante da viewport**, independente do `overflow-y-auto` do `main`:

1. **Container do Kanban**: trocar `flex-1` por altura explícita calculada com CSS (`h-[calc(100vh-<offset>)]`), garantindo que o container sempre ocupe do ponto atual até o fundo da tela
2. **Cada coluna**: adicionar `h-full` para herdar a altura do container
3. **Div interna dos cards**: usar `flex-1 overflow-y-auto` (scroll interno quando há muitos cards) e remover o `min-h-[calc(100vh-280px)]` fixo

Isso torna a zona de drop um retângulo que vai até o final da tela, e quando há muitos cards, a coluna faz scroll interno em vez de crescer.

### Alterações

**`src/pages/ProjectsPage.tsx`**
- Linha 362: Container do Kanban — trocar `flex-1` por `h-[calc(100vh-140px)]` (offset para header + padding da página)
- Linha 367-370: Coluna — adicionar `h-full`
- Linha 432-433: Div interna dos cards — trocar `min-h-[calc(100vh-280px)]` por `min-h-0 overflow-y-auto`

**`src/pages/TasksPage.tsx`**
- Linha 258: Container do Kanban — trocar `flex-1` por `h-[calc(100vh-200px)]` (offset maior por causa dos filtros acima)
- Linha 264-265: Coluna — adicionar `h-full`
- Linha 328-329: Div interna dos cards — trocar `min-h-[calc(100vh-280px)]` por `min-h-0 overflow-y-auto`

Nenhuma mudança de banco de dados.

