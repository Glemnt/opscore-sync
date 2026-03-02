
CREATE TABLE public.client_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  class_name text NOT NULL DEFAULT 'bg-muted text-muted-foreground border-border',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read client_statuses" ON public.client_statuses FOR SELECT USING (true);
CREATE POLICY "Auth users can insert client_statuses" ON public.client_statuses FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update client_statuses" ON public.client_statuses FOR UPDATE USING (true);
CREATE POLICY "Auth users can delete client_statuses" ON public.client_statuses FOR DELETE USING (true);

INSERT INTO public.client_statuses (key, label, class_name) VALUES
  ('active', 'Ativo', 'bg-success-light text-success border-success/20'),
  ('paused', 'Pausado', 'bg-warning-light text-warning border-warning/20'),
  ('churned', 'Churned', 'bg-destructive/10 text-destructive border-destructive/20'),
  ('onboarding', 'Onboarding', 'bg-info-light text-info border-info/20');
