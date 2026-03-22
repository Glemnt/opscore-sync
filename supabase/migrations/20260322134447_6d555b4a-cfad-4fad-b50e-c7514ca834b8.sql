
-- Add only missing foreign key constraints (skip ones that already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_squad_id_fkey') THEN
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id) ON DELETE SET NULL;
  END IF;
END $$;
