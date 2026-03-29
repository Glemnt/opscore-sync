

## Esteira de Producao — Expandir Sistema de Demandas

### Resumo

Adicionar ~12 novos campos a tabela `tasks`, expandir colunas do Kanban para 7, implementar geracao automatica de demandas ao vincular plataforma, e adicionar sistema de dependencias pai-filho entre tarefas.

---

### 1. Migration — Novos campos na tabela `tasks` + tabela `task_dependencies`

```sql
ALTER TABLE tasks
  ADD COLUMN platform_id uuid DEFAULT NULL,
  ADD COLUMN etapa text NOT NULL DEFAULT '',
  ADD COLUMN bloqueia_passagem boolean NOT NULL DEFAULT false,
  ADD COLUMN depende_cliente boolean NOT NULL DEFAULT false,
  ADD COLUMN aguardando_cliente boolean NOT NULL DEFAULT false,
  ADD COLUMN origem_tarefa text NOT NULL DEFAULT 'manual',
  ADD COLUMN link_entrega text NOT NULL DEFAULT '',
  ADD COLUMN print_entrega text NOT NULL DEFAULT '',
  ADD COLUMN observacao_entrega text NOT NULL DEFAULT '',
  ADD COLUMN nota_entrega numeric DEFAULT NULL,
  ADD COLUMN approval_status text NOT NULL DEFAULT 'pending';

CREATE TABLE task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  depends_on_task_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);
```

RLS: authenticated full CRUD on `task_dependencies`.

Tambem: INSERT novas colunas no `task_statuses` para as 3 colunas faltantes (revisao, bloqueada, aguardando_aprovacao) caso nao existam.

---

### 2. Tipos e Mapeamento

**`src/types/index.ts`** — Expandir interface `Task` com os novos campos: `platformId`, `etapa`, `bloqueiaPassagem`, `dependeCliente`, `aguardandoCliente`, `origemTarefa`, `linkEntrega`, `printEntrega`, `observacaoEntrega`, `notaEntrega`, `approvalStatus`, `dependsOn` (array de task IDs).

**`src/types/database.ts`** — Atualizar `mapDbTask` para mapear os novos campos snake_case → camelCase.

**`src/hooks/useTasksQuery.ts`** — Expandir `useAddTask` e `useUpdateTask` com os novos campos no keyMap. Adicionar query de `task_dependencies` no fetch principal. Adicionar mutations para inserir/remover dependencias.

---

### 3. Expandir Kanban de Demandas

Inserir via migration (ou data insert) 3 novos status no `task_statuses`:
- `revisao` — "Revisao"
- `bloqueada` — "Bloqueada"  
- `aguardando_aprovacao` — "Aguardando Aprovacao"

O Kanban ja e dinamico (usa `task_statuses`), entao as colunas aparecerao automaticamente.

---

### 4. Expandir AddTaskDialog e TaskDetailModal

**`AddTaskDialog.tsx`**:
- Tornar `platformId` (select de client_platforms filtrado pelo cliente selecionado) obrigatorio
- Adicionar campos: etapa (select), bloqueiaPassagem (checkbox), dependeCliente (checkbox), origemTarefa (readonly, default 'manual')
- Validacao: cliente + plataforma + responsavel obrigatorios

**`TaskDetailModal.tsx`**:
- Adicionar secao "Entrega" (visivel ao mover para revisao/aprovacao): linkEntrega, printEntrega (URL), observacaoEntrega
- Adicionar campo notaEntrega (0-10, editavel por coordenador)
- Exibir dependencias: lista de tarefas pai com status
- Exibir badge "Bloqueada: aguardando [tarefa pai]" quando dependencias nao concluidas

---

### 5. Geracao Automatica de Demandas

**Logica**: Ao adicionar plataforma a um cliente (em `AddClientDialog` ou `EditPlatformDialog`), apos criar o registro em `client_platforms`, exibir dialog de confirmacao. Se confirmado:

1. Buscar `platform_catalog` pelo slug da plataforma → pegar `checklist_obrigatorio`
2. Para cada item do checklist, criar task com:
   - `platformId` = ID da client_platform recem-criada
   - `origemTarefa` = 'automatica'
   - Responsavel = colaborador do squad com funcao correspondente e menor `currentLoad`
   - Prazo = `start_date` + dias do `expectedDay` do item (dias uteis)
   - `bloqueiaPassagem` = item.bloqueia_passagem
   - Dependencias entre tarefas sequenciais

**Novo componente**: `GenerateAutoDemandsDialog.tsx` — dialog que recebe clientId, platformId, platformSlug e executa a geracao.

**Integracao**: Chamar apos criacao de client_platform nos componentes existentes.

---

### 6. Logica de Dependencias no Kanban

No `TasksPage.tsx`, ao tentar mover uma tarefa de "Backlog" para "Em Andamento":
- Verificar se todas as tarefas em `dependsOn` estao com status 'done' E `approvalStatus` = 'approved'
- Se nao, bloquear o drop e exibir toast com nome das tarefas pendentes

Cards de tarefas bloqueadas exibem icone de cadeado e tooltip "Aguardando: [nomes]".

---

### 7. Cards Expandidos no Kanban

Atualizar renderizacao dos cards em `TasksPage.tsx`:
- Badge de plataforma (colorido)
- Badge de prioridade (P1 vermelho, P2 laranja, P3 amarelo, P4 cinza) — mapear `high`→P1, `medium`→P3, `low`→P4
- Indicador de atraso (dias, vermelho)
- Icone cadeado se `bloqueiaPassagem`
- Icone corrente se tem dependencias pendentes

---

### 8. Filtros Expandidos

Adicionar ao painel de filtros do Kanban de demandas:
- Cliente (select)
- Prioridade (P1-P4)
- bloqueiaPassagem (sim/nao)

---

### Arquivos

- `supabase/migrations/` — nova migration (ALTER TABLE tasks + CREATE TABLE task_dependencies + INSERT task_statuses)
- `src/types/index.ts` — expandir Task
- `src/types/database.ts` — expandir mapDbTask
- `src/hooks/useTasksQuery.ts` — novos campos + dependencias
- `src/components/AddTaskDialog.tsx` — platform_id obrigatorio, novos campos
- `src/components/TaskDetailModal.tsx` — secao entrega, dependencias, nota
- `src/components/GenerateAutoDemandsDialog.tsx` (novo) — geracao automatica
- `src/pages/TasksPage.tsx` — cards expandidos, logica dependencias no drop, filtros
- `src/components/AddClientDialog.tsx` ou `EditPlatformDialog.tsx` — trigger para geracao automatica

### Ordem

1. Migration (campos + tabela + status)
2. Types + database mapper
3. Hooks (tasks query expandido + dependencias)
4. AddTaskDialog (campos obrigatorios)
5. TaskDetailModal (entrega + dependencias)
6. GenerateAutoDemandsDialog
7. TasksPage (cards + filtros + logica drop)
8. Integracao geracao automatica nos dialogs de plataforma

