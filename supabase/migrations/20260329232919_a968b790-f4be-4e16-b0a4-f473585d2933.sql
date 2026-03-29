
CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  platform_id uuid,
  task_id uuid,
  event_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  old_value text,
  new_value text,
  triggered_by text NOT NULL DEFAULT 'Sistema',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read timeline_events" ON public.timeline_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert timeline_events" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_timeline_client ON public.timeline_events(client_id);
CREATE INDEX idx_timeline_platform ON public.timeline_events(platform_id);
CREATE INDEX idx_timeline_created ON public.timeline_events(created_at DESC);
