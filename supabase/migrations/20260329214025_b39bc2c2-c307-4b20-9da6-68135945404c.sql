ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS approved_by text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rejection_count integer NOT NULL DEFAULT 0;