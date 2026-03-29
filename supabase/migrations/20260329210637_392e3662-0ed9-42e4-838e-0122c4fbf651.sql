
CREATE TABLE public.onboarding_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  completed_by text DEFAULT '',
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, task_key)
);

ALTER TABLE public.onboarding_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read onboarding_checklist_items" ON public.onboarding_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert onboarding_checklist_items" ON public.onboarding_checklist_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update onboarding_checklist_items" ON public.onboarding_checklist_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete onboarding_checklist_items" ON public.onboarding_checklist_items FOR DELETE TO authenticated USING (true);
