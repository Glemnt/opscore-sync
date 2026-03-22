
-- =============================================
-- MIGRATION 1: Fix RLS policies (public → authenticated)
-- =============================================

-- task_types: drop public policies, recreate as authenticated
DROP POLICY IF EXISTS "Auth users can delete task_types" ON public.task_types;
DROP POLICY IF EXISTS "Auth users can insert task_types" ON public.task_types;
DROP POLICY IF EXISTS "Auth users can read task_types" ON public.task_types;
DROP POLICY IF EXISTS "Auth users can update task_types" ON public.task_types;

CREATE POLICY "Auth users can read task_types" ON public.task_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert task_types" ON public.task_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update task_types" ON public.task_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete task_types" ON public.task_types FOR DELETE TO authenticated USING (true);

-- client_statuses: drop public policies, recreate as authenticated
DROP POLICY IF EXISTS "Auth users can delete client_statuses" ON public.client_statuses;
DROP POLICY IF EXISTS "Auth users can insert client_statuses" ON public.client_statuses;
DROP POLICY IF EXISTS "Auth users can read client_statuses" ON public.client_statuses;
DROP POLICY IF EXISTS "Auth users can update client_statuses" ON public.client_statuses;

CREATE POLICY "Auth users can read client_statuses" ON public.client_statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert client_statuses" ON public.client_statuses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update client_statuses" ON public.client_statuses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete client_statuses" ON public.client_statuses FOR DELETE TO authenticated USING (true);

-- task_statuses: drop public policies, recreate as authenticated
DROP POLICY IF EXISTS "Auth users can delete task_statuses" ON public.task_statuses;
DROP POLICY IF EXISTS "Auth users can insert task_statuses" ON public.task_statuses;
DROP POLICY IF EXISTS "Auth users can read task_statuses" ON public.task_statuses;
DROP POLICY IF EXISTS "Auth users can update task_statuses" ON public.task_statuses;

CREATE POLICY "Auth users can read task_statuses" ON public.task_statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert task_statuses" ON public.task_statuses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update task_statuses" ON public.task_statuses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete task_statuses" ON public.task_statuses FOR DELETE TO authenticated USING (true);

-- platforms: drop public policies, recreate as authenticated
DROP POLICY IF EXISTS "Auth users can delete platforms" ON public.platforms;
DROP POLICY IF EXISTS "Auth users can insert platforms" ON public.platforms;
DROP POLICY IF EXISTS "Auth users can read platforms" ON public.platforms;
DROP POLICY IF EXISTS "Auth users can update platforms" ON public.platforms;

CREATE POLICY "Auth users can read platforms" ON public.platforms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert platforms" ON public.platforms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update platforms" ON public.platforms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete platforms" ON public.platforms FOR DELETE TO authenticated USING (true);

-- =============================================
-- MIGRATION 2: Add missing foreign keys
-- =============================================

DO $$ BEGIN
  -- subtasks.task_id → tasks.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subtasks_task_id_fkey') THEN
    ALTER TABLE public.subtasks ADD CONSTRAINT subtasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
  END IF;

  -- task_chat_notes.task_id → tasks.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_chat_notes_task_id_fkey') THEN
    ALTER TABLE public.task_chat_notes ADD CONSTRAINT task_chat_notes_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
  END IF;

  -- client_change_logs.client_id → clients.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_change_logs_client_id_fkey') THEN
    ALTER TABLE public.client_change_logs ADD CONSTRAINT client_change_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- client_chat_notes.client_id → clients.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_chat_notes_client_id_fkey') THEN
    ALTER TABLE public.client_chat_notes ADD CONSTRAINT client_chat_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- platform_change_logs.client_platform_id → client_platforms.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_change_logs_client_platform_id_fkey') THEN
    ALTER TABLE public.platform_change_logs ADD CONSTRAINT platform_change_logs_client_platform_id_fkey FOREIGN KEY (client_platform_id) REFERENCES public.client_platforms(id) ON DELETE CASCADE;
  END IF;

  -- platform_chat_notes.client_platform_id → client_platforms.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_chat_notes_client_platform_id_fkey') THEN
    ALTER TABLE public.platform_chat_notes ADD CONSTRAINT platform_chat_notes_client_platform_id_fkey FOREIGN KEY (client_platform_id) REFERENCES public.client_platforms(id) ON DELETE CASCADE;
  END IF;

  -- platform_documents.client_platform_id → client_platforms.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_documents_client_platform_id_fkey') THEN
    ALTER TABLE public.platform_documents ADD CONSTRAINT platform_documents_client_platform_id_fkey FOREIGN KEY (client_platform_id) REFERENCES public.client_platforms(id) ON DELETE CASCADE;
  END IF;

  -- project_checklist_items.project_id → projects.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_checklist_items_project_id_fkey') THEN
    ALTER TABLE public.project_checklist_items ADD CONSTRAINT project_checklist_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;

  -- tasks.client_id → clients.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_client_id_fkey') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- tasks.project_id → projects.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_project_id_fkey') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;

  -- tasks.flow_id → flows.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_flow_id_fkey') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.flows(id) ON DELETE SET NULL;
  END IF;

  -- projects.client_id → clients.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_client_id_fkey') THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- client_platforms.client_id → clients.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_platforms_client_id_fkey') THEN
    ALTER TABLE public.client_platforms ADD CONSTRAINT client_platforms_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- client_platforms.squad_id → squads.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_platforms_squad_id_fkey') THEN
    ALTER TABLE public.client_platforms ADD CONSTRAINT client_platforms_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id) ON DELETE SET NULL;
  END IF;

  -- client_flows.client_id → clients.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_flows_client_id_fkey') THEN
    ALTER TABLE public.client_flows ADD CONSTRAINT client_flows_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- client_flows.flow_id → flows.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_flows_flow_id_fkey') THEN
    ALTER TABLE public.client_flows ADD CONSTRAINT client_flows_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.flows(id) ON DELETE CASCADE;
  END IF;

  -- clients.squad_id → squads.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_squad_id_fkey') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id) ON DELETE SET NULL;
  END IF;

  -- phase_demand_templates.flow_id → flows.id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'phase_demand_templates_flow_id_fkey') THEN
    ALTER TABLE public.phase_demand_templates ADD CONSTRAINT phase_demand_templates_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.flows(id) ON DELETE SET NULL;
  END IF;
END $$;
