

## Plano: Remover pagina intermediaria de plataformas

### Situacao atual

O fluxo e: Squad → Cliente (Kanban) → **Selecao de Plataforma (Step 2.5)** → Demandas.
O Step 2.5 exibe um Kanban de fases com as plataformas do cliente selecionado.

### Nova estrutura

Squad → Cards de "Cliente + Plataforma" → Demandas da plataforma

No Kanban do squad (Step 2), ao inves de 1 card por cliente, renderizar **1 card por combinacao cliente+plataforma**. Clicar no card define `selectedClient` e `selectedPlatform` simultaneamente, pulando direto para as demandas (Step 3).

### Alteracoes em `src/pages/ProjectsPage.tsx`

**1. Transformar os cards do Step 2**
- Iterar sobre `clientPlatformsData` filtrados pelo squad ao inves de iterar sobre `clients`
- Cada card exibe: nome do cliente + nome da plataforma (ex: "Loja X — Mercado Livre"), fase, saude, responsavel
- O drag-and-drop muda o status do **cliente** (mantendo comportamento atual)
- Clique no card: `setSelectedClient(client)` + `setSelectedPlatform(slug)` (pula Step 2.5)

**2. Remover Step 2.5 inteiro**
- Eliminar o bloco `if (selectedPlatform === null && selectedClient.platforms...)` (linhas ~813-1357)
- Mover dialogs necessarios (GenerateDemandsDialog, TransferPlatformDialog, EditPlatformDialog, delete confirmation) para o Step 3 ou para fora dos blocos condicionais
- Manter o botao "Adicionar Plataforma" acessivel de outra forma (ex: no header do Step 2 ou via menu de contexto)

**3. Ajustar navegacao do Step 3**
- Botao "Voltar" no Step 3 volta para o Kanban do squad (`setSelectedClient(null)` + `setSelectedPlatform(null)`)
- Header mostra "Cliente — Plataforma" como ja faz

**4. Preservar funcionalidades**
- Editar/excluir plataforma: mover para dropdown no card do Step 2 ou manter no Step 3
- "Ver Todas" as demandas de um cliente: pode ser acessado via card especial ou removido se desnecessario
- Gerenciar plataformas e gerar demandas: botoes no header do Step 2 ou Step 3

