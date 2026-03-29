
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS max_capacity integer NOT NULL DEFAULT 8;

CREATE TABLE public.scheduled_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  platform_id uuid,
  milestone_type text NOT NULL,
  scheduled_date date NOT NULL,
  actual_date date,
  status text NOT NULL DEFAULT 'pendente',
  responsible text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read scheduled_milestones" ON public.scheduled_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert scheduled_milestones" ON public.scheduled_milestones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update scheduled_milestones" ON public.scheduled_milestones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete scheduled_milestones" ON public.scheduled_milestones FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_milestones_client ON public.scheduled_milestones(client_id);
CREATE INDEX idx_milestones_date ON public.scheduled_milestones(scheduled_date);
CREATE INDEX idx_milestones_responsible ON public.scheduled_milestones(responsible);
