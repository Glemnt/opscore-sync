
-- Drop existing unique on key
ALTER TABLE public.client_statuses DROP CONSTRAINT IF EXISTS client_statuses_key_key;

-- Add board column
ALTER TABLE public.client_statuses ADD COLUMN board text NOT NULL DEFAULT 'all';

-- Add composite unique
ALTER TABLE public.client_statuses ADD CONSTRAINT client_statuses_key_board_key UNIQUE (key, board);

-- Duplicate for clients
INSERT INTO public.client_statuses (key, label, class_name, sort_order, board)
SELECT key, label, class_name, sort_order, 'clients'
FROM public.client_statuses WHERE board = 'all';

-- Duplicate for squads
INSERT INTO public.client_statuses (key, label, class_name, sort_order, board)
SELECT key, label, class_name, sort_order, 'squads'
FROM public.client_statuses WHERE board = 'all';

-- Remove generic
DELETE FROM public.client_statuses WHERE board = 'all';
