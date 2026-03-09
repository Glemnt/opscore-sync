
-- platform_chat_notes
CREATE TABLE public.platform_chat_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_platform_id uuid NOT NULL REFERENCES public.client_platforms(id) ON DELETE CASCADE,
  message text NOT NULL,
  author text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_chat_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read platform_chat_notes" ON public.platform_chat_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert platform_chat_notes" ON public.platform_chat_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can delete platform_chat_notes" ON public.platform_chat_notes FOR DELETE TO authenticated USING (true);

-- platform_change_logs
CREATE TABLE public.platform_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_platform_id uuid NOT NULL REFERENCES public.client_platforms(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value text NOT NULL DEFAULT '',
  new_value text NOT NULL DEFAULT '',
  changed_by text NOT NULL DEFAULT '',
  changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_change_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read platform_change_logs" ON public.platform_change_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert platform_change_logs" ON public.platform_change_logs FOR INSERT TO authenticated WITH CHECK (true);

-- platform_documents
CREATE TABLE public.platform_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_platform_id uuid NOT NULL REFERENCES public.client_platforms(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  uploaded_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read platform_documents" ON public.platform_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert platform_documents" ON public.platform_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can delete platform_documents" ON public.platform_documents FOR DELETE TO authenticated USING (true);

-- Storage bucket for platform documents
INSERT INTO storage.buckets (id, name, public) VALUES ('platform-documents', 'platform-documents', true);

-- Storage RLS
CREATE POLICY "Auth users can upload platform docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'platform-documents');
CREATE POLICY "Auth users can read platform docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'platform-documents');
CREATE POLICY "Auth users can delete platform docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'platform-documents');
