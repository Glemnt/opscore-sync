

## Criacao de Status Customizados na Pagina de Clientes

### Contexto
Atualmente os status de clientes sao fixos no codigo (`active`, `paused`, `churned`, `onboarding`), definidos como union type em `src/types/index.ts` e mapeados em `clientStatusConfig` em `src/lib/config.ts`. O usuario quer poder criar novos status personalizados.

### Abordagem
Seguir o mesmo padrao ja usado para tipos de demanda (`task_types` table + hook), criando uma tabela `client_statuses` no banco e um hook para consulta/criacao.

### Alteracoes

**1. Criar tabela `client_statuses` no banco (migration)**
```sql
CREATE TABLE public.client_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  class_name text NOT NULL DEFAULT 'bg-muted text-muted-foreground border-border',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_statuses ENABLE ROW LEVEL SECURITY;
-- Politicas para usuarios autenticados
CREATE POLICY "Auth users can read client_statuses" ON public.client_statuses FOR SELECT USING (true);
CREATE POLICY "Auth users can insert client_statuses" ON public.client_statuses FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update client_statuses" ON public.client_statuses FOR UPDATE USING (true);
CREATE POLICY "Auth users can delete client_statuses" ON public.client_statuses FOR DELETE USING (true);

-- Inserir os status padrao
INSERT INTO public.client_statuses (key, label, class_name) VALUES
  ('active', 'Ativo', 'bg-success-light text-success border-success/20'),
  ('paused', 'Pausado', 'bg-warning-light text-warning border-warning/20'),
  ('churned', 'Churned', 'bg-destructive/10 text-destructive border-destructive/20'),
  ('onboarding', 'Onboarding', 'bg-info-light text-info border-info/20');
```

**2. Criar hook `src/hooks/useClientStatusesQuery.ts`**
- `useClientStatusesQuery()` — busca todos os status do banco
- `useClientStatusesMap()` — retorna `Record<string, { label, className }>` mesclando `clientStatusConfig` estatico com os do banco
- `useAddClientStatus()` — mutation para inserir novo status
- `useDeleteClientStatus()` — mutation para deletar status customizado

**3. Adicionar botao "Novo Status" na pagina `ClientsPage.tsx`**
- Adicionar um botao com icone `+` ao lado dos filtros de status
- Ao clicar, abre um mini-dialog (ou popover) com campos: Nome do status e cor (seletor com opcoes pre-definidas de cores)
- Ao salvar, insere no banco via `useAddClientStatus`

**4. Atualizar filtros e cards para usar status dinamicos**
- `ClientsPage.tsx`: os `statusFilters` passam a ser construidos dinamicamente a partir do hook `useClientStatusesQuery` em vez de array estatico
- `ClientCard`: resolver `statusConf` com fallback para o mapa dinamico (igual foi feito com `taskTypeConfig`)
- `ClientDetailModal.tsx`: o `<select>` de status passa a listar opcoes dinamicas do banco
- `DashboardPage.tsx`: o card "Clientes por Etapa" passa a usar status dinamicos

**5. Atualizar `ProjectsPage.tsx` (Squads kanban)**
- As colunas kanban de clientes (`clientCols`) passam a ser inicializadas a partir dos status do banco

### Impacto
- O tipo `ClientStatus` em `types/index.ts` sera relaxado para `string` (com os valores padrao como alias), similar ao que ja foi feito com `TaskType`
- O `clientStatusConfig` estatico continua como fallback, mas a fonte primaria passa a ser o banco

