
-- Add sort_order column to task_statuses
ALTER TABLE public.task_statuses ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Add sort_order column to client_statuses
ALTER TABLE public.client_statuses ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Populate sort_order for existing task_statuses based on created_at order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS rn
  FROM public.task_statuses
)
UPDATE public.task_statuses t SET sort_order = o.rn FROM ordered o WHERE t.id = o.id;

-- Populate sort_order for existing client_statuses based on label order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY label) - 1 AS rn
  FROM public.client_statuses
)
UPDATE public.client_statuses t SET sort_order = o.rn FROM ordered o WHERE t.id = o.id;
