

## Fluxo de Aprovacao de Demandas

### Resumo

Adicionar campos de aprovacao a tabela `tasks`, implementar botoes Aprovar/Reprovar no TaskDetailModal e no card do Kanban, e aplicar logica de fluxo automatico (colaborador entrega → aguardando aprovacao → coordenador aprova/reprova).

---

### 1. Migration — Novos campos na tabela `tasks`

```sql
ALTER TABLE tasks
  ADD COLUMN approved_by text NOT NULL DEFAULT '',
  ADD COLUMN approved_at timestamptz DEFAULT NULL,
  ADD COLUMN rejection_reason text NOT NULL DEFAULT '',
  ADD COLUMN rejection_count integer NOT NULL DEFAULT 0;
```

O campo `approval_status` ja existe (text, default 'pending').

---

### 2. Tipos e Mapeamento

**`src/types/index.ts`** — Adicionar a `Task`: `approvedBy`, `approvedAt`, `rejectionReason`, `rejectionCount`.

**`src/types/database.ts`** — Expandir `mapDbTask` com os 4 novos campos.

**`src/hooks/useTasksQuery.ts`** — Adicionar ao keyMap de `useUpdateTask` e ao insert de `useAddTask`: `approvedBy → approved_by`, `approvedAt → approved_at`, `rejectionReason → rejection_reason`, `rejectionCount → rejection_count`.

---

### 3. Logica de Fluxo no Kanban (`TasksPage.tsx`)

No `handleDrop`:
- Se o colaborador arrasta para `aguardando_aprovacao`: permitir, setar `approval_status = 'pending'`.
- Se arrasta para `done` diretamente: redirecionar para `aguardando_aprovacao` com toast informativo ("Demandas precisam de aprovacao").
- Manter bloqueio de dependencias existente.

No `TaskCard`:
- Se `task.status === 'aguardando_aprovacao'`: exibir botoes Aprovar (verde) e Reprovar (vermelho) direto no card (visivel para coordenadores/managers/admins).
- Se `task.rejectionReason` e `task.status !== 'done'`: banner vermelho com motivo da reprovacao.
- Badge de retrabalho se `rejectionCount > 0`.

---

### 4. Aprovar/Reprovar no TaskDetailModal

Adicionar secao "Aprovacao" visivel quando `task.status === 'aguardando_aprovacao'`:

**Aprovar**:
- Input obrigatorio: nota 0-10 (`notaEntrega`)
- Comentario opcional
- Ao confirmar: `status → done`, `approval_status → approved`, `approvedBy → currentUser.name`, `approvedAt → now()`, `notaEntrega → nota`

**Reprovar**:
- Input obrigatorio: motivo da reprovacao (`rejectionReason`)
- Ao confirmar: `status → in_progress`, `approval_status → rejected`, `rejectionReason → motivo`, `rejectionCount += 1`

Exibir historico de reprovacoes (rejectionCount) e ultimo motivo quando existir.

---

### 5. Secao de Entrega no TaskDetailModal

Quando `task.status` e `in_progress` ou `revisao`, exibir secao para o colaborador preencher antes de submeter:
- `linkEntrega` (URL)
- `printEntrega` (URL)
- `observacaoEntrega` (texto)
- Botao "Enviar para Aprovacao" que move para `aguardando_aprovacao`

---

### 6. Destaque visual da coluna "Aguardando Aprovacao"

No Kanban, a coluna `aguardando_aprovacao` recebe `border-b-amber-500` e icone de relogio no header.

---

### Arquivos

- `supabase/migrations/` — nova migration (4 colunas)
- `src/types/index.ts` — expandir Task
- `src/types/database.ts` — expandir mapDbTask
- `src/hooks/useTasksQuery.ts` — novos campos no keyMap
- `src/components/TaskDetailModal.tsx` — secao aprovacao + entrega
- `src/pages/TasksPage.tsx` — logica de fluxo no drop + botoes no card + destaque visual

### Ordem

1. Migration
2. Types + database mapper
3. Hooks
4. TaskDetailModal (aprovacao + entrega)
5. TasksPage (fluxo + cards + visual)

