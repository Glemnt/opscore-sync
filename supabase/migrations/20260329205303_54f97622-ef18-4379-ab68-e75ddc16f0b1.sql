
-- Add operational columns to client_platforms
ALTER TABLE public.client_platforms
  ADD COLUMN IF NOT EXISTS platform_status text NOT NULL DEFAULT 'nao_iniciada',
  ADD COLUMN IF NOT EXISTS motivo_atraso text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prazo_interno date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS data_prevista_passagem date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS data_real_passagem date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS depende_cliente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pronta_performance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quem_aprovou_passagem text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS observacao_passagem text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pendencias_remanescentes text NOT NULL DEFAULT '';

-- Create client_platform_checklist table
CREATE TABLE public.client_platform_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_platform_id uuid NOT NULL REFERENCES public.client_platforms(id) ON DELETE CASCADE,
  catalog_item_id text NOT NULL,
  label text NOT NULL,
  etapa text NOT NULL DEFAULT '',
  bloqueia_passagem boolean NOT NULL DEFAULT false,
  done boolean NOT NULL DEFAULT false,
  checked_by text NOT NULL DEFAULT '',
  checked_at timestamptz DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_platform_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read client_platform_checklist" ON public.client_platform_checklist FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert client_platform_checklist" ON public.client_platform_checklist FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update client_platform_checklist" ON public.client_platform_checklist FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete client_platform_checklist" ON public.client_platform_checklist FOR DELETE TO authenticated USING (true);
