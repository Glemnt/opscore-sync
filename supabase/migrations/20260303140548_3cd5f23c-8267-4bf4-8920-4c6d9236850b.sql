
CREATE TABLE public.client_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform_slug text NOT NULL,
  phase text NOT NULL DEFAULT 'onboarding',
  responsible text NOT NULL DEFAULT '',
  squad_id uuid REFERENCES public.squads(id) ON DELETE SET NULL,
  start_date date DEFAULT CURRENT_DATE,
  deadline date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, platform_slug)
);

ALTER TABLE public.client_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read client_platforms" ON public.client_platforms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert client_platforms" ON public.client_platforms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update client_platforms" ON public.client_platforms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete client_platforms" ON public.client_platforms FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_client_platforms_updated_at
BEFORE UPDATE ON public.client_platforms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
