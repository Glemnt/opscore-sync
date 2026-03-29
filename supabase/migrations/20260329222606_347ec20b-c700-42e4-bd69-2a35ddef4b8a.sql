
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tempo_real_minutos numeric DEFAULT NULL;

CREATE TABLE IF NOT EXISTS task_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  pause_start timestamptz NOT NULL DEFAULT now(),
  pause_end timestamptz DEFAULT NULL,
  reason text NOT NULL DEFAULT 'outro',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read task_pauses" ON task_pauses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert task_pauses" ON task_pauses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update task_pauses" ON task_pauses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete task_pauses" ON task_pauses FOR DELETE TO authenticated USING (true);
