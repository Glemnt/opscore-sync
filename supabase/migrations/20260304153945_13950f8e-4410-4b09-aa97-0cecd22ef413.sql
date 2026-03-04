ALTER TABLE public.clients ADD COLUMN phone text NOT NULL DEFAULT '';
ALTER TABLE public.clients ADD COLUMN cnpj text NOT NULL DEFAULT '';
ALTER TABLE public.clients ADD COLUMN email text NOT NULL DEFAULT '';