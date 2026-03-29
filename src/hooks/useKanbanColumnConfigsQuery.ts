import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KanbanColumnConfig {
  id: string;
  key: string;
  label: string;
  groupKey: string;
  groupLabel: string;
  sortOrder: number;
  isActive: boolean;
}

export interface KanbanColumnGroup {
  groupKey: string;
  groupLabel: string;
  columns: KanbanColumnConfig[];
}

export function useKanbanColumnConfigsQuery() {
  return useQuery({
    queryKey: ['kanban_column_configs'],
    queryFn: async (): Promise<KanbanColumnConfig[]> => {
      const { data, error } = await supabase
        .from('kanban_column_configs' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return ((data ?? []) as any[]).map((r): KanbanColumnConfig => ({
        id: r.id,
        key: r.key,
        label: r.label,
        groupKey: r.group_key,
        groupLabel: r.group_label,
        sortOrder: r.sort_order,
        isActive: r.is_active,
      }));
    },
  });
}

export function useKanbanColumnGroups(): KanbanColumnGroup[] {
  const { data: columns = [] } = useKanbanColumnConfigsQuery();
  const groupMap = new Map<string, KanbanColumnGroup>();
  
  for (const col of columns) {
    if (!groupMap.has(col.groupKey)) {
      groupMap.set(col.groupKey, { groupKey: col.groupKey, groupLabel: col.groupLabel, columns: [] });
    }
    groupMap.get(col.groupKey)!.columns.push(col);
  }
  
  return Array.from(groupMap.values());
}
