

## Plano: Dialog "Nova Demanda" Completo

### Criar `src/components/AddTaskDialog.tsx`

Dialog com os seguintes campos:

| Campo | Componente | Dados |
|---|---|---|
| Cliente | Select | Clientes visíveis via `useAuth().getVisibleClients()` |
| Projeto vinculado | Select (opcional) | Projetos do cliente selecionado |
| Tipo de demanda | Select | `taskTypeConfig` (Anúncio, Copy, Design, etc.) |
| Nome da demanda | Input | Texto livre |
| Prazo | DatePicker (Popover + Calendar) | `pointer-events-auto` no Calendar |
| Responsável | Select | Membros do squad do cliente selecionado |
| Prioridade | Select | Alta, Média, Baixa |
| Tempo estimado (h) | Input number | Horas |
| Observação | Textarea | Texto livre |
| Subtarefas iniciais | Input + botão adicionar | Lista dinâmica de strings |

**Lógica:**
- Ao selecionar cliente, filtra projetos e responsáveis pelo squad do cliente
- Ao submeter, cria `Task` com status `backlog`, `createdAt` = agora, e adiciona via `addTask` do `TasksContext`
- Toast de sucesso após criação

### Atualizar `src/pages/TasksPage.tsx`

- Importar `AddTaskDialog`
- Estado `showAddDialog` para controlar abertura
- Botão "Nova Demanda" abre o dialog
- Card aparece automaticamente na coluna Backlog

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/components/AddTaskDialog.tsx` | Novo |
| `src/pages/TasksPage.tsx` | Integrar dialog ao botão |

