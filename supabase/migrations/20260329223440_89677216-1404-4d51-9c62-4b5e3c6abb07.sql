
CREATE TABLE task_client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  notified_by text NOT NULL DEFAULT '',
  notified_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read task_client_notifications" ON task_client_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert task_client_notifications" ON task_client_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update task_client_notifications" ON task_client_notifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete task_client_notifications" ON task_client_notifications FOR DELETE TO authenticated USING (true);
