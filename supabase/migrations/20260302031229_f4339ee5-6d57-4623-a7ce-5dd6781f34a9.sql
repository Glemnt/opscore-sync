
-- Create task_statuses table (mirrors client_statuses)
CREATE TABLE public.task_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  class_name TEXT NOT NULL DEFAULT 'bg-muted text-muted-foreground',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Auth users can read task_statuses" ON public.task_statuses FOR SELECT USING (true);
CREATE POLICY "Auth users can insert task_statuses" ON public.task_statuses FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update task_statuses" ON public.task_statuses FOR UPDATE USING (true);
CREATE POLICY "Auth users can delete task_statuses" ON public.task_statuses FOR DELETE USING (true);

-- Seed default statuses
INSERT INTO public.task_statuses (key, label, class_name) VALUES
  ('backlog', 'Backlog', 'bg-muted text-muted-foreground'),
  ('in_progress', 'Em Andamento', 'bg-info-light text-info'),
  ('waiting_client', 'Aguard. Cliente', 'bg-warning-light text-warning'),
  ('done', 'Concluído', 'bg-success-light text-success');

-- Change tasks.status from enum to text
ALTER TABLE public.tasks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.tasks ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.tasks ALTER COLUMN status SET DEFAULT 'backlog';
