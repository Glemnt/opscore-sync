

## Plano: Adicionar modo edição com botão lápis e salvar no TaskDetailModal

### Problema atual

O `TaskDetailModal` salva cada campo individualmente no banco a cada alteração (inline editing). O usuário quer um fluxo explícito: **modo visualização** (readonly) por padrão, botão de **lápis** para entrar em edição, e botão **Salvar** para persistir tudo de uma vez.

### Alteração em `src/components/TaskDetailModal.tsx`

1. **Adicionar estado `editing`** (boolean, default `false`) e **estados draft** para todos os campos editáveis: `draftTitle`, `draftType`, `draftResponsible`, `draftDeadline`, `draftPriority`, `draftPlatforms`, `draftEstimatedTime`, `draftRealTime`

2. **Botão lápis no header** — ao lado do título, um `<Pencil>` que ativa `editing = true` e popula todos os drafts com os valores atuais da task

3. **Modo visualização (editing = false)**: todos os campos mostram valores readonly (texto, badges, sem selects/inputs editáveis)

4. **Modo edição (editing = true)**: os selects e inputs aparecem como estão hoje, mas operam sobre os estados draft em vez de chamar `updateTask` diretamente

5. **Botão Salvar no footer** — visível apenas em modo edição. Ao clicar, chama `updateTask(task.id, { title, type, responsible, deadline, priority, platforms, estimatedTime, realTime })` com todos os drafts de uma vez, depois seta `editing = false`

6. **Botão Cancelar** — ao lado do salvar, descarta os drafts e volta para visualização

7. **Subtarefas e Notas** — continuam funcionando como hoje (toggle/add independentes do modo edição), pois já são ações pontuais

### Reflexo visual no DemandCard

O `DemandCard` em `ProjectsPage.tsx` já lê os dados da task diretamente. Ao salvar no modal, o `updateTask` invalida o cache e o card atualiza automaticamente — nenhuma alteração necessária no card.

### Arquivo alterado

- `src/components/TaskDetailModal.tsx`

