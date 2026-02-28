
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.client_status AS ENUM ('active', 'paused', 'churned', 'onboarding');
CREATE TYPE public.project_status AS ENUM ('backlog', 'in_progress', 'waiting_client', 'done');
CREATE TYPE public.task_status AS ENUM ('backlog', 'in_progress', 'waiting_client', 'done');
CREATE TYPE public.priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.team_role AS ENUM ('cs', 'operacional', 'design', 'copy', 'gestao');
CREATE TYPE public.contract_type AS ENUM ('mrr', 'tcv');
CREATE TYPE public.platform_type AS ENUM ('mercado_livre', 'shopee', 'shein');
CREATE TYPE public.health_color AS ENUM ('green', 'yellow', 'red', 'white');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =============================================
-- USER ROLES (for RLS)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SQUADS
-- =============================================
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader TEXT NOT NULL,
  members TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read squads" ON public.squads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert squads" ON public.squads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update squads" ON public.squads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete squads" ON public.squads FOR DELETE TO authenticated USING (true);

-- =============================================
-- CLIENTS
-- =============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  segment TEXT NOT NULL DEFAULT '',
  responsible TEXT NOT NULL DEFAULT '',
  squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.client_status NOT NULL DEFAULT 'active',
  notes TEXT NOT NULL DEFAULT '',
  logo TEXT,
  monthly_revenue NUMERIC DEFAULT 0,
  active_projects INTEGER NOT NULL DEFAULT 0,
  pending_tasks INTEGER NOT NULL DEFAULT 0,
  contract_type public.contract_type NOT NULL DEFAULT 'mrr',
  payment_day INTEGER NOT NULL DEFAULT 1,
  contract_duration_months INTEGER,
  platforms public.platform_type[] DEFAULT '{}',
  health_color public.health_color DEFAULT 'white',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- =============================================
-- CLIENT CHANGE LOGS
-- =============================================
CREATE TABLE public.client_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT NOT NULL DEFAULT '',
  new_value TEXT NOT NULL DEFAULT '',
  changed_by TEXT NOT NULL DEFAULT '',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_change_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read client_change_logs" ON public.client_change_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert client_change_logs" ON public.client_change_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- CLIENT CHAT NOTES
-- =============================================
CREATE TABLE public.client_chat_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_chat_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read client_chat_notes" ON public.client_chat_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert client_chat_notes" ON public.client_chat_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can delete client_chat_notes" ON public.client_chat_notes FOR DELETE TO authenticated USING (true);

-- =============================================
-- PROJECTS
-- =============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'criacao_anuncio',
  responsible TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE NOT NULL DEFAULT CURRENT_DATE,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  status public.project_status NOT NULL DEFAULT 'backlog',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete projects" ON public.projects FOR DELETE TO authenticated USING (true);

-- =============================================
-- PROJECT CHECKLIST ITEMS
-- =============================================
CREATE TABLE public.project_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.project_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read checklist" ON public.project_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert checklist" ON public.project_checklist_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update checklist" ON public.project_checklist_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete checklist" ON public.project_checklist_items FOR DELETE TO authenticated USING (true);

-- =============================================
-- TASKS
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  responsible TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'anuncio',
  estimated_time NUMERIC NOT NULL DEFAULT 0,
  real_time NUMERIC,
  deadline DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.task_status NOT NULL DEFAULT 'backlog',
  priority public.priority_level NOT NULL DEFAULT 'medium',
  comments TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);

-- =============================================
-- SUBTASKS
-- =============================================
CREATE TABLE public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  checked_by TEXT,
  checked_at TIMESTAMPTZ
);
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read subtasks" ON public.subtasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert subtasks" ON public.subtasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update subtasks" ON public.subtasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete subtasks" ON public.subtasks FOR DELETE TO authenticated USING (true);

-- =============================================
-- TASK CHAT NOTES
-- =============================================
CREATE TABLE public.task_chat_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_chat_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read task_chat_notes" ON public.task_chat_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert task_chat_notes" ON public.task_chat_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can delete task_chat_notes" ON public.task_chat_notes FOR DELETE TO authenticated USING (true);

-- =============================================
-- FLOWS
-- =============================================
CREATE TABLE public.flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  steps TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read flows" ON public.flows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert flows" ON public.flows FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update flows" ON public.flows FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete flows" ON public.flows FOR DELETE TO authenticated USING (true);

-- =============================================
-- CUSTOM TEMPLATES
-- =============================================
CREATE TABLE public.custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subtasks TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read templates" ON public.custom_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert templates" ON public.custom_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update templates" ON public.custom_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete templates" ON public.custom_templates FOR DELETE TO authenticated USING (true);

-- =============================================
-- CLIENT FLOWS
-- =============================================
CREATE TABLE public.client_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  flow_id UUID REFERENCES public.flows(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.client_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read client_flows" ON public.client_flows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert client_flows" ON public.client_flows FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can delete client_flows" ON public.client_flows FOR DELETE TO authenticated USING (true);

-- =============================================
-- APP USERS (profiles linked to auth.users)
-- =============================================
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  role public.team_role NOT NULL DEFAULT 'operacional',
  access_level INTEGER NOT NULL DEFAULT 1,
  squad_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read app_users" ON public.app_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can update own profile" ON public.app_users FOR UPDATE TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "Admins can manage app_users" ON public.app_users FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TEAM MEMBERS
-- =============================================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role public.team_role NOT NULL DEFAULT 'operacional',
  squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL,
  avatar TEXT,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  avg_time NUMERIC NOT NULL DEFAULT 0,
  late_tasks INTEGER NOT NULL DEFAULT 0,
  current_load INTEGER NOT NULL DEFAULT 0,
  on_time_pct NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read team_members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update team_members" ON public.team_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete team_members" ON public.team_members FOR DELETE TO authenticated USING (true);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
