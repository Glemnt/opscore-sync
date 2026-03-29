ALTER TABLE clients
  ADD COLUMN health_score numeric DEFAULT NULL,
  ADD COLUMN health_calculated_at timestamptz DEFAULT NULL,
  ADD COLUMN health_override boolean NOT NULL DEFAULT false,
  ADD COLUMN health_override_reason text NOT NULL DEFAULT '';