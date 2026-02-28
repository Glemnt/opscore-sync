import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDbProject, type DbProject, type DbChecklistItem } from '@/types/database';

export function useProjectsQuery() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const [projRes, checkRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('project_checklist_items').select('*'),
      ]);
      if (projRes.error) throw projRes.error;
      const projects = projRes.data as DbProject[];
      const items = (checkRes.data ?? []) as DbChecklistItem[];
      return projects.map((p) =>
        mapDbProject(p, items.filter((i) => i.project_id === p.id))
      );
    },
  });
}
