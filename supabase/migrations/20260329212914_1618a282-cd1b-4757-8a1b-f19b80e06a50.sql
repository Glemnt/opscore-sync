
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS platform_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS etapa text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bloqueia_passagem boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS depende_cliente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aguardando_cliente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS origem_tarefa text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS link_entrega text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS print_entrega text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS observacao_entrega text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nota_entrega numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read task_dependencies" ON public.task_dependencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert task_dependencies" ON public.task_dependencies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update task_dependencies" ON public.task_dependencies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete task_dependencies" ON public.task_dependencies FOR DELETE TO authenticated USING (true);

INSERT INTO public.task_statuses (key, label, class_name, sort_order)
SELECT 'revisao', 'Revisão', 'bg-purple-100 text-purple-700', 20
WHERE NOT EXISTS (SELECT 1 FROM public.task_statuses WHERE key = 'revisao');

INSERT INTO public.task_statuses (key, label, class_name, sort_order)
SELECT 'bloqueada', 'Bloqueada', 'bg-red-100 text-red-700', 40
WHERE NOT EXISTS (SELECT 1 FROM public.task_statuses WHERE key = 'bloqueada');

INSERT INTO public.task_statuses (key, label, class_name, sort_order)
SELECT 'aguardando_aprovacao', 'Aguardando Aprovação', 'bg-amber-100 text-amber-700', 50
WHERE NOT EXISTS (SELECT 1 FROM public.task_statuses WHERE key = 'aguardando_aprovacao');
