
-- CS Journey Templates (master list of D1-D90 tasks)
CREATE TABLE cs_journey_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  day_number integer NOT NULL,
  phase text NOT NULL DEFAULT 'onboard',
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_journey_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read cs_journey_templates" ON cs_journey_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert cs_journey_templates" ON cs_journey_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update cs_journey_templates" ON cs_journey_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete cs_journey_templates" ON cs_journey_templates FOR DELETE TO authenticated USING (true);

-- CS Journey Items (per-client instances)
CREATE TABLE cs_journey_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id uuid REFERENCES cs_journey_templates(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  actual_date date,
  status text NOT NULL DEFAULT 'pendente',
  completed_by text NOT NULL DEFAULT '',
  completed_at timestamptz,
  notes text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  day_number integer NOT NULL DEFAULT 0,
  phase text NOT NULL DEFAULT 'onboard',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_journey_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read cs_journey_items" ON cs_journey_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert cs_journey_items" ON cs_journey_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update cs_journey_items" ON cs_journey_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete cs_journey_items" ON cs_journey_items FOR DELETE TO authenticated USING (true);

-- Seed default D1-D90 templates
INSERT INTO cs_journey_templates (title, day_number, phase, description, sort_order) VALUES
('Reunião de Onboarding (gravar, briefing, acessos, cronograma)', 1, 'onboard', '', 1),
('Enviar kit de boas-vindas', 1, 'onboard', '', 2),
('Confirmar acessos recebidos', 2, 'onboard', '', 3),
('Enviar vídeo de orientação', 2, 'onboard', '', 4),
('Reunião de implementação', 3, 'onboard', '', 5),
('Follow-up — verificar se equipe está executando', 5, 'onboard', '', 6),
('Contato com cliente — status update', 7, 'onboard', '', 7),
('Follow-up — verificar progresso de anúncios', 10, 'onboard', '', 8),
('Contato com cliente — alinhamento pré-entrega', 12, 'onboard', '', 9),
('Reunião de Entrega (apresentar resultados + plano de ação)', 14, 'onboard', '', 10),
('Coleta de NPS', 15, 'onboard', '', 11),
('Verificar passagem para Performance', 16, 'primeiros_resultados', '', 12),
('Contato com cliente — expectativas pós-implementação', 18, 'primeiros_resultados', '', 13),
('Prazo externo do cliente (D20)', 20, 'primeiros_resultados', '', 14),
('Follow-up — primeiras métricas', 22, 'primeiros_resultados', '', 15),
('Contato com cliente — ajustes necessários', 25, 'primeiros_resultados', '', 16),
('Relatório de primeiro mês', 28, 'primeiros_resultados', '', 17),
('Reunião de checkpoint 30 dias', 30, 'primeiros_resultados', '', 18),
('Contato com cliente — vendas', 35, 'estabilizacao', '', 19),
('Follow-up — gargalos', 40, 'estabilizacao', '', 20),
('Contato com cliente — satisfação', 45, 'estabilizacao', '', 21),
('Follow-up — performance plataformas', 50, 'estabilizacao', '', 22),
('Contato com cliente — preparar escala', 55, 'estabilizacao', '', 23),
('Reunião de checkpoint 60 dias + NPS intermediário', 60, 'estabilizacao', '', 24),
('Contato com cliente — evolução', 65, 'consolidacao', '', 25),
('Follow-up — métricas escala', 70, 'consolidacao', '', 26),
('Contato com cliente — plano de crescimento', 75, 'consolidacao', '', 27),
('Preparar relatório trimestral', 80, 'consolidacao', '', 28),
('Contato — pré-reunião 90 dias', 85, 'consolidacao', '', 29),
('Reunião de checkpoint 90 dias + NPS trimestral', 90, 'consolidacao', '', 30);
