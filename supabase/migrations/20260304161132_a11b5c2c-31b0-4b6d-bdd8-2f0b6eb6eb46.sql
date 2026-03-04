CREATE TABLE public.platform_phase_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  class_name text NOT NULL DEFAULT 'bg-muted text-muted-foreground border-border',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_phase_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read platform_phase_statuses" ON public.platform_phase_statuses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert platform_phase_statuses" ON public.platform_phase_statuses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update platform_phase_statuses" ON public.platform_phase_statuses
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete platform_phase_statuses" ON public.platform_phase_statuses
  FOR DELETE TO authenticated USING (true);

INSERT INTO public.platform_phase_statuses (key, label, sort_order) VALUES
  ('onboarding', 'Onboarding', 0),
  ('implementacao', 'Implementação', 1),
  ('escala', 'Escala', 2),
  ('performance', 'Performance', 3);