

## Plano: Botão de Fluxos no Kanban da Plataforma (Squads) com auto-atribuição ao cliente

### O que muda

**1. `src/components/FlowManagerDialog.tsx`**
- Adicionar props opcionais `defaultClientId?: string` e `defaultClientName?: string`
- No modo `assign`: quando `defaultClientId` for fornecido, esconder o seletor de cliente e usar o valor pré-definido automaticamente
- No modo `create`: após salvar o fluxo, se `defaultClientId` estiver presente, atribuir automaticamente o fluxo ao cliente via `useAddClientFlow`

**2. `src/pages/ProjectsPage.tsx`**
- No step 3 (Kanban de tarefas da plataforma), adicionar um dropdown "Fluxos" com as opções "Criar Fluxo", "Editar Fluxo" e "Atribuir Fluxo" -- igual ao que existe na `TasksPage`
- Passar `defaultClientId` e `defaultClientName` (do `selectedClient`) para o `FlowManagerDialog`
- Posicionar o botão ao lado do "Adicionar demanda" no header do Kanban

### Arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/components/FlowManagerDialog.tsx` | Adicionar props `defaultClientId`/`defaultClientName`, auto-atribuir no create, esconder seletor no assign |
| `src/pages/ProjectsPage.tsx` | Importar `FlowManagerDialog`, adicionar dropdown de Fluxos no step 3 |

Nenhuma mudança de banco de dados.

