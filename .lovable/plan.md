

## Plano: Kanban editável para Clientes e Plataformas na página Squads

### Situação atual
- **Aba Clientes (Step 2)**: Já possui Kanban editável com colunas dinâmicas da tabela `client_statuses` — adicionar, renomear, excluir e reordenar colunas funcionam.
- **Aba Plataformas (Step 2.5)**: Usa as mesmas colunas de `client_statuses` para organizar plataformas por fase, mas **não é editável** — sem opções de adicionar, renomear, excluir ou reordenar colunas. Além disso, não há drag-and-drop para mover plataformas entre fases.

### O que será feito

#### 1. Nova tabela `platform_phase_statuses` (migração SQL)
Criar uma tabela independente para as colunas do Kanban de plataformas, separada de `client_statuses`:

```sql
CREATE TABLE public.platform_phase_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  class_name text NOT NULL DEFAULT 'bg-muted text-muted-foreground border-border',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_phase_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read" ON public.platform_phase_statuses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage" ON public.platform_phase_statuses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed com fases padrão
INSERT INTO public.platform_phase_statuses (key, label, sort_order) VALUES
  ('onboarding', 'Onboarding', 0),
  ('implementacao', 'Implementação', 1),
  ('escala', 'Escala', 2),
  ('performance', 'Performance', 3);
```

#### 2. Novo hook `usePlatformPhaseStatusesQuery.ts`
Criar hook idêntico ao `useClientStatusesQuery` mas apontando para `platform_phase_statuses`:
- `usePlatformPhaseStatusesQuery()` — listar colunas ordenadas
- `useAddPlatformPhaseStatus()` — adicionar coluna
- `useDeletePlatformPhaseStatus()` — excluir coluna
- `useUpdatePlatformPhaseStatus()` — renomear coluna
- `useReorderPlatformPhaseStatuses()` — reordenar colunas via drag-and-drop

#### 3. Tornar o Kanban de Plataformas editável (`ProjectsPage.tsx` — Step 2.5)
Aplicar na seção de plataformas (linhas ~682-831) a mesma mecânica de edição que já existe no Kanban de clientes:
- Usar `platform_phase_statuses` como fonte de colunas (em vez de `clientStatuses`)
- Adicionar botão "Nova Coluna" com dialog
- Colunas renomeáveis ao clicar no label
- Botão de excluir coluna com confirmação
- Drag-and-drop de colunas para reordenar
- Drag-and-drop de cards de plataforma entre colunas (atualizando o campo `phase` na tabela `client_platforms`)

