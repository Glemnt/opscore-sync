
CREATE TABLE public.user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL DEFAULT 'weekly',
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  meta_passagens integer NOT NULL DEFAULT 5,
  meta_destravamentos integer NOT NULL DEFAULT 3,
  meta_reducao_backlog integer NOT NULL DEFAULT 5,
  meta_anuncios_dia integer NOT NULL DEFAULT 24,
  meta_anuncios_cliente integer NOT NULL DEFAULT 75,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period, period_start)
);

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read user_goals" ON public.user_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert user_goals" ON public.user_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update user_goals" ON public.user_goals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete user_goals" ON public.user_goals FOR DELETE TO authenticated USING (true);

CREATE TABLE public.nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  sent_at date NOT NULL DEFAULT CURRENT_DATE,
  responded_at date,
  score integer,
  category text,
  liked_most text NOT NULL DEFAULT '',
  improve text NOT NULL DEFAULT '',
  would_recommend boolean,
  manager_notified boolean NOT NULL DEFAULT false,
  action_plan text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read nps_responses" ON public.nps_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert nps_responses" ON public.nps_responses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update nps_responses" ON public.nps_responses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete nps_responses" ON public.nps_responses FOR DELETE TO authenticated USING (true);
