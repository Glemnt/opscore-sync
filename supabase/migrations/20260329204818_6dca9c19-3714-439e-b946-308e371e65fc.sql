
CREATE TABLE public.platform_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ativo',
  prazo_onboarding integer NOT NULL DEFAULT 15,
  prazo_implementacao integer NOT NULL DEFAULT 30,
  checklist_obrigatorio jsonb NOT NULL DEFAULT '[]'::jsonb,
  tipos_demanda_permitidos text[] NOT NULL DEFAULT '{}'::text[],
  criterios_passagem text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read platform_catalog" ON public.platform_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert platform_catalog" ON public.platform_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update platform_catalog" ON public.platform_catalog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete platform_catalog" ON public.platform_catalog FOR DELETE TO authenticated USING (true);

INSERT INTO public.platform_catalog (name, slug, prazo_onboarding, prazo_implementacao, checklist_obrigatorio, criterios_passagem) VALUES
('Mercado Livre', 'mercado_livre', 15, 30,
 '[{"id":"ml-1","label":"Conta criada","etapa":"onboarding","bloqueia_passagem":true},{"id":"ml-2","label":"Titularidade validada","etapa":"onboarding","bloqueia_passagem":true},{"id":"ml-3","label":"Termômetro ativado","etapa":"implementacao","bloqueia_passagem":true},{"id":"ml-4","label":"Full/Flex configurado","etapa":"implementacao","bloqueia_passagem":true},{"id":"ml-5","label":"Logística validada","etapa":"implementacao","bloqueia_passagem":true},{"id":"ml-6","label":"Impressora térmica configurada","etapa":"implementacao","bloqueia_passagem":false},{"id":"ml-7","label":"Emissor configurado","etapa":"implementacao","bloqueia_passagem":true},{"id":"ml-8","label":"Anúncios criados (mínimo 25)","etapa":"implementacao","bloqueia_passagem":true},{"id":"ml-9","label":"Promoções criadas","etapa":"implementacao","bloqueia_passagem":false},{"id":"ml-10","label":"Decoração validada","etapa":"implementacao","bloqueia_passagem":false}]'::jsonb,
 ARRAY['Checklist 100% concluído','Mínimo 25 anúncios ativos','Logística operacional']),

('Shopee', 'shopee', 10, 25,
 '[{"id":"sp-1","label":"Conta criada","etapa":"onboarding","bloqueia_passagem":true},{"id":"sp-2","label":"Titularidade validada","etapa":"onboarding","bloqueia_passagem":true},{"id":"sp-3","label":"Anúncios publicados (mínimo 25)","etapa":"implementacao","bloqueia_passagem":true},{"id":"sp-4","label":"Decoração","etapa":"implementacao","bloqueia_passagem":false},{"id":"sp-5","label":"Clips criados","etapa":"implementacao","bloqueia_passagem":false},{"id":"sp-6","label":"Promoções ativadas","etapa":"implementacao","bloqueia_passagem":false},{"id":"sp-7","label":"Logística configurada","etapa":"implementacao","bloqueia_passagem":true}]'::jsonb,
 ARRAY['Checklist 100% concluído','Mínimo 25 anúncios ativos']),

('Shein', 'shein', 10, 20,
 '[{"id":"sh-1","label":"Conta criada","etapa":"onboarding","bloqueia_passagem":true},{"id":"sh-2","label":"Titularidade validada","etapa":"onboarding","bloqueia_passagem":true},{"id":"sh-3","label":"Autorização aprovada","etapa":"onboarding","bloqueia_passagem":true},{"id":"sh-4","label":"Anúncios publicados","etapa":"implementacao","bloqueia_passagem":true},{"id":"sh-5","label":"Documentação validada","etapa":"implementacao","bloqueia_passagem":true}]'::jsonb,
 ARRAY['Autorização aprovada','Anúncios publicados','Documentação validada']),

('TikTok', 'tiktok', 10, 20,
 '[{"id":"tk-1","label":"Conta criada","etapa":"onboarding","bloqueia_passagem":true},{"id":"tk-2","label":"Catálogo configurado","etapa":"implementacao","bloqueia_passagem":true},{"id":"tk-3","label":"Shop aprovado","etapa":"implementacao","bloqueia_passagem":true},{"id":"tk-4","label":"Integração feita","etapa":"implementacao","bloqueia_passagem":true},{"id":"tk-5","label":"Conteúdo base publicado","etapa":"implementacao","bloqueia_passagem":false}]'::jsonb,
 ARRAY['Shop aprovado','Catálogo configurado','Integração feita']);
