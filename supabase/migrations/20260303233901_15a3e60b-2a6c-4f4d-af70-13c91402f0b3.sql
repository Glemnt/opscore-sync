
CREATE TABLE public.phase_demand_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase text NOT NULL,
  title text NOT NULL,
  demand_owner text NOT NULL DEFAULT 'internal',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phase_demand_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read phase_demand_templates"
  ON public.phase_demand_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Auth users can insert phase_demand_templates"
  ON public.phase_demand_templates FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Auth users can update phase_demand_templates"
  ON public.phase_demand_templates FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Auth users can delete phase_demand_templates"
  ON public.phase_demand_templates FOR DELETE TO authenticated
  USING (true);
