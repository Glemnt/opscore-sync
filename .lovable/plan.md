

## Plano: Configuracao independente de colunas por Kanban

### Problema

A tabela `client_statuses` e compartilhada entre o Kanban da pagina **Clientes** e o Kanban da pagina **Squads**. Ao adicionar ou excluir uma coluna em um, o outro e afetado. Os demais Kanbans (Demandas e Plataformas) ja possuem tabelas independentes.

### Solucao

Adicionar uma coluna `board` na tabela `client_statuses` para isolar as configuracoes de cada Kanban.

**1. Migracao SQL**

```sql
-- Adicionar coluna board
ALTER TABLE public.client_statuses ADD COLUMN board text NOT NULL DEFAULT 'all';

-- Duplicar registros existentes: um conjunto para 'clients', outro para 'squads'
INSERT INTO public.client_statuses (key, label, class_name, sort_order, board)
SELECT key, label, class_name, sort_order, 'clients'
FROM public.client_statuses WHERE board = 'all';

INSERT INTO public.client_statuses (key, label, class_name, sort_order, board)
SELECT key, label, class_name, sort_order, 'squads'
FROM public.client_statuses WHERE board = 'all';

-- Remover os registros genericos
DELETE FROM public.client_statuses WHERE board = 'all';
```

**2. `src/hooks/useClientStatusesQuery.ts`**

- Atualizar `useClientStatusesQuery` para aceitar parametro `board: string`
- Filtrar por `.eq('board', board)` em todas as queries
- Atualizar `useAddClientStatus` para aceitar `board` no input
- Atualizar query keys para incluir `[board]`

**3. `src/pages/ClientsPage.tsx`**

- Passar `board='clients'` para os hooks de status

**4. `src/pages/ProjectsPage.tsx`**

- Passar `board='squads'` para os hooks de status de clientes

### Impacto
- 1 migracao SQL
- 1 hook alterado (`useClientStatusesQuery.ts`)
- 2 paginas atualizadas (parametro board)
- Kanbans de Demandas e Plataformas ja sao independentes, sem alteracao necessaria

