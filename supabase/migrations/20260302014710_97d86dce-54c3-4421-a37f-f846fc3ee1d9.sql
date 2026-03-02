
-- Create platforms table
CREATE TABLE public.platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read platforms" ON public.platforms FOR SELECT USING (true);
CREATE POLICY "Auth users can insert platforms" ON public.platforms FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update platforms" ON public.platforms FOR UPDATE USING (true);
CREATE POLICY "Auth users can delete platforms" ON public.platforms FOR DELETE USING (true);

-- Seed with existing platforms
INSERT INTO public.platforms (name, slug) VALUES 
  ('Mercado Livre', 'mercado_livre'),
  ('Shopee', 'shopee'),
  ('Shein', 'shein');

-- Change clients.platforms from platform_type[] to text[] to support dynamic platforms
ALTER TABLE public.clients ALTER COLUMN platforms TYPE text[] USING platforms::text[];
