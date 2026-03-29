
-- Create kanban_column_configs table
CREATE TABLE public.kanban_column_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  group_key text NOT NULL,
  group_label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_column_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read kanban_column_configs" ON public.kanban_column_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert kanban_column_configs" ON public.kanban_column_configs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update kanban_column_configs" ON public.kanban_column_configs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete kanban_column_configs" ON public.kanban_column_configs FOR DELETE TO authenticated USING (true);

-- Seed 25 columns across 4 groups
INSERT INTO public.kanban_column_configs (key, label, group_key, group_label, sort_order) VALUES
-- IMPLEMENTAÇÃO (0-10)
('onboard_novo_contrato', 'Onboard — Novo contrato', 'implementacao', 'Implementação', 0),
('onboard_aguardando_docs', 'Onboard — Aguardando documentos', 'implementacao', 'Implementação', 1),
('onboard_conta_cnpj', 'Onboard — Conta / CNPJ / Titularidade', 'implementacao', 'Implementação', 2),
('onboard_aguardando_cliente', 'Onboard — Aguardando cliente', 'implementacao', 'Implementação', 3),
('impl_cadastro_config', 'Implementação — Cadastro / Configuração', 'implementacao', 'Implementação', 4),
('impl_ativacao_conta', 'Implementação — Ativação de conta', 'implementacao', 'Implementação', 5),
('impl_publicacao_anuncios', 'Implementação — Publicação / Anúncios', 'implementacao', 'Implementação', 6),
('impl_logistica_termometro', 'Implementação — Logística / Termômetro / Flex / Full', 'implementacao', 'Implementação', 7),
('impl_decoracao_promocoes', 'Implementação — Decoração / Promoções / Clips', 'implementacao', 'Implementação', 8),
('impl_validacao_final', 'Implementação — Validação final', 'implementacao', 'Implementação', 9),
('pronto_performance', 'Pronto para Performance', 'implementacao', 'Implementação', 10),
-- PERFORMANCE (11-14)
('perf_recebido', 'Recebido de implementação', 'performance', 'Performance', 11),
('perf_ajuste_inicial', 'Ajuste inicial', 'performance', 'Performance', 12),
('perf_estabilizacao', 'Estabilização', 'performance', 'Performance', 13),
('perf_otimizacao', 'Otimização', 'performance', 'Performance', 14),
-- ESCALA (15-17)
('escala_operacao', 'Operação escalada', 'escala', 'Escala', 15),
('escala_novos_projetos', 'Novos projetos', 'escala', 'Escala', 16),
('escala_melhoria', 'Melhoria contínua', 'escala', 'Escala', 17),
-- AUXILIARES (18-21)
('aux_aguardando_cliente', 'Aguardando cliente', 'auxiliar', 'Auxiliares', 18),
('aux_bloqueado', 'Bloqueado', 'auxiliar', 'Auxiliares', 19),
('aux_critico', 'Crítico', 'auxiliar', 'Auxiliares', 20),
('aux_inativo', 'Inativo', 'auxiliar', 'Auxiliares', 21);

-- Sync platform_phase_statuses to match these new columns
DELETE FROM public.platform_phase_statuses;

INSERT INTO public.platform_phase_statuses (key, label, sort_order, class_name) VALUES
('onboard_novo_contrato', 'Onboard — Novo contrato', 0, 'bg-blue-100 text-blue-800 border-blue-200'),
('onboard_aguardando_docs', 'Onboard — Aguardando documentos', 1, 'bg-blue-100 text-blue-800 border-blue-200'),
('onboard_conta_cnpj', 'Onboard — Conta / CNPJ / Titularidade', 2, 'bg-blue-100 text-blue-800 border-blue-200'),
('onboard_aguardando_cliente', 'Onboard — Aguardando cliente', 3, 'bg-yellow-100 text-yellow-800 border-yellow-200'),
('impl_cadastro_config', 'Implementação — Cadastro / Configuração', 4, 'bg-indigo-100 text-indigo-800 border-indigo-200'),
('impl_ativacao_conta', 'Implementação — Ativação de conta', 5, 'bg-indigo-100 text-indigo-800 border-indigo-200'),
('impl_publicacao_anuncios', 'Implementação — Publicação / Anúncios', 6, 'bg-indigo-100 text-indigo-800 border-indigo-200'),
('impl_logistica_termometro', 'Implementação — Logística / Termômetro / Flex / Full', 7, 'bg-indigo-100 text-indigo-800 border-indigo-200'),
('impl_decoracao_promocoes', 'Implementação — Decoração / Promoções / Clips', 8, 'bg-indigo-100 text-indigo-800 border-indigo-200'),
('impl_validacao_final', 'Implementação — Validação final', 9, 'bg-indigo-100 text-indigo-800 border-indigo-200'),
('pronto_performance', 'Pronto para Performance', 10, 'bg-green-100 text-green-800 border-green-200'),
('perf_recebido', 'Recebido de implementação', 11, 'bg-emerald-100 text-emerald-800 border-emerald-200'),
('perf_ajuste_inicial', 'Ajuste inicial', 12, 'bg-emerald-100 text-emerald-800 border-emerald-200'),
('perf_estabilizacao', 'Estabilização', 13, 'bg-emerald-100 text-emerald-800 border-emerald-200'),
('perf_otimizacao', 'Otimização', 14, 'bg-emerald-100 text-emerald-800 border-emerald-200'),
('escala_operacao', 'Operação escalada', 15, 'bg-purple-100 text-purple-800 border-purple-200'),
('escala_novos_projetos', 'Novos projetos', 16, 'bg-purple-100 text-purple-800 border-purple-200'),
('escala_melhoria', 'Melhoria contínua', 17, 'bg-purple-100 text-purple-800 border-purple-200'),
('aux_aguardando_cliente', 'Aguardando cliente', 18, 'bg-yellow-100 text-yellow-800 border-yellow-200'),
('aux_bloqueado', 'Bloqueado', 19, 'bg-red-100 text-red-800 border-red-200'),
('aux_critico', 'Crítico', 20, 'bg-red-100 text-red-800 border-red-200'),
('aux_inativo', 'Inativo', 21, 'bg-muted text-muted-foreground border-border');
