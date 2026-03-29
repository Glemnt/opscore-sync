
-- delay_reasons table
CREATE TABLE public.delay_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delay_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read delay_reasons" ON public.delay_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert delay_reasons" ON public.delay_reasons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update delay_reasons" ON public.delay_reasons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete delay_reasons" ON public.delay_reasons FOR DELETE TO authenticated USING (true);

-- Seed delay reasons
INSERT INTO public.delay_reasons (label, sort_order) VALUES
  ('Cliente não envia documentos', 1),
  ('Cliente não responde', 2),
  ('Cliente não envia fotos/informações', 3),
  ('Cliente não abriu conta', 4),
  ('Erro de titularidade', 5),
  ('Erro de plataforma', 6),
  ('Problema com CNPJ', 7),
  ('Conta bloqueada', 8),
  ('Falta de publicação de anúncios', 9),
  ('Falta de ativação de termômetro', 10),
  ('Falta de promoção', 11),
  ('Falta de decoração', 12),
  ('Falta de logística / frete', 13),
  ('Aguardando validação interna', 14),
  ('Aguardando time interno', 15),
  ('Problema técnico', 16),
  ('Sem acesso', 17),
  ('Sem código / login', 18),
  ('Falta de comunicação interna', 19),
  ('Outro', 20);

-- action_plans table
CREATE TABLE public.action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  platform_id uuid,
  identified_at date NOT NULL DEFAULT CURRENT_DATE,
  days_delayed integer NOT NULL DEFAULT 0,
  issue_description text NOT NULL DEFAULT '',
  crisis_type text NOT NULL DEFAULT 'atraso_tarefa',
  root_cause text NOT NULL DEFAULT '',
  responsible_for_delay text NOT NULL DEFAULT '',
  action_plan_text text NOT NULL DEFAULT '',
  new_deadline date,
  resolution_status text NOT NULL DEFAULT 'aberto',
  manager_aware boolean NOT NULL DEFAULT false,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read action_plans" ON public.action_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert action_plans" ON public.action_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update action_plans" ON public.action_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete action_plans" ON public.action_plans FOR DELETE TO authenticated USING (true);

-- Add motivo_atraso to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS motivo_atraso text NOT NULL DEFAULT '';
