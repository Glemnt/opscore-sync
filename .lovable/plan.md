

## Plano: Corrigir exclusao de colunas Kanban (incluindo status orfaos)

### Problema

Existem dois tipos de colunas nos Kanbans:
1. **Colunas do banco** — registros nas tabelas `client_statuses`, `task_statuses`, `platform_phase_statuses`
2. **Colunas orfas** — geradas dinamicamente a partir de valores presentes nos registros dos clientes/tarefas mas ausentes nas tabelas de status

Ao tentar excluir uma coluna orfa, o `deleteMut.mutate(key)` executa `DELETE FROM x WHERE key = ?` no banco, mas como o registro nao existe la, nada acontece e a coluna reaparece no proximo render.

### Solucao

Para cada Kanban (Clientes no ProjectsPage, Plataformas no ProjectsPage, Demandas no TasksPage), ao excluir uma coluna:

1. **Se a coluna existe no banco** — executar o delete normalmente (ja funciona)
2. **Se e uma coluna orfa** — nao tentar deletar do banco, mas sim inserir o status no banco e logo em seguida deletar, OU simplesmente atualizar os registros que usam esse status para um status valido (mover para a primeira coluna)

A abordagem mais limpa: ao confirmar exclusao de uma coluna orfa, **atualizar todos os registros que usam aquele status** para o primeiro status valido da lista, eliminando o orfao na fonte.

### Alteracoes

**1. `src/pages/ProjectsPage.tsx`**

- `confirmRemoveCol` (Kanban clientes, ~linha 340): Verificar se o status existe em `clientStatuses`. Se nao existir (orfao), atualizar todos os clientes com esse status para o primeiro status disponivel via `updateClient`.
- `platDeleteColConfirm` handler (~linha 1142): Mesma logica para plataformas — verificar se existe em `platformPhaseStatuses`, se nao, atualizar os `client_platforms` com essa phase para a primeira phase valida.

**2. `src/pages/TasksPage.tsx`**

- `handleDeleteCol` (~linha 134): Verificar se o status existe em `taskStatuses`. Se orfao, atualizar as tasks com esse status para o primeiro status valido.

**3. `src/pages/ClientsPage.tsx`**

- Handler de delete (~linha 283): Verificar se `deletingStatusKey` existe em `clientStatuses`. Se orfao, atualizar os clientes com esse status.

### Resumo de impacto
- 3 arquivos alterados (ProjectsPage, TasksPage, ClientsPage)
- ~15 linhas adicionadas por arquivo
- 0 migracoes SQL
- Resolve o problema de colunas que nao desaparecem ao clicar excluir

