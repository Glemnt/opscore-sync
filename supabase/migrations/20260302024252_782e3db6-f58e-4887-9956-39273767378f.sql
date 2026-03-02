
CREATE TABLE public.task_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  color text NOT NULL DEFAULT 'bg-gray-100 text-gray-700',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read task_types" ON public.task_types FOR SELECT USING (true);
CREATE POLICY "Auth users can insert task_types" ON public.task_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update task_types" ON public.task_types FOR UPDATE USING (true);
CREATE POLICY "Auth users can delete task_types" ON public.task_types FOR DELETE USING (true);

-- Seed default types from taskTypeConfig
INSERT INTO public.task_types (key, label, color) VALUES
  ('anuncio', 'Anúncio', 'bg-blue-100 text-blue-700'),
  ('criativo', 'Criativo', 'bg-purple-100 text-purple-700'),
  ('copy', 'Copy', 'bg-yellow-100 text-yellow-700'),
  ('planejamento', 'Planejamento', 'bg-green-100 text-green-700'),
  ('relatorio', 'Relatório', 'bg-orange-100 text-orange-700'),
  ('reuniao', 'Reunião', 'bg-pink-100 text-pink-700'),
  ('setup', 'Setup', 'bg-indigo-100 text-indigo-700'),
  ('otimizacao', 'Otimização', 'bg-teal-100 text-teal-700'),
  ('estrategia', 'Estratégia', 'bg-red-100 text-red-700'),
  ('design', 'Design', 'bg-cyan-100 text-cyan-700'),
  ('edicao_video', 'Edição de Vídeo', 'bg-rose-100 text-rose-700')
ON CONFLICT (key) DO NOTHING;
