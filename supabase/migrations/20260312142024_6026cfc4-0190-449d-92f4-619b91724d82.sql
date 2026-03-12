
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'auxiliar_ecommerce';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'assistente_ecommerce';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'head';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'coo';
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'ceo';

ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS hire_date date;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS birthday date;
