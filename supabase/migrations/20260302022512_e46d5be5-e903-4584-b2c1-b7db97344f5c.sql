
-- Convert tasks.platform from text to text[]
ALTER TABLE public.tasks
  ALTER COLUMN platform TYPE text[]
  USING CASE WHEN platform IS NOT NULL THEN ARRAY[platform] ELSE NULL END;
