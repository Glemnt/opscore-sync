import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePlatformCatalogQuery } from '@/hooks/usePlatformCatalogQuery';
import { useAddTask } from '@/hooks/useTasksQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useTeamMembersQuery } from '@/hooks/useTeamMembersQuery';
import { toast } from 'sonner';
import { Zap, Loader2 } from 'lucide-react';
import { addBusinessDays } from '@/lib/onboardingTasks';

interface ChecklistItem {
  id: string;
  label: string;
  etapa: string;
  bloqueia_passagem?: boolean;
  expectedDay?: number;
  role?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string;
  clientName: string;
  platformId: string;
  platformSlug: string;
  squadId?: string | null;
  startDate?: string;
}

export function GenerateAutoDemandsDialog({ open, onOpenChange, clientId, clientName, platformId, platformSlug, squadId, startDate }: Props) {
  const { data: catalog = [] } = usePlatformCatalogQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: teamMembers = [] } = useTeamMembersQuery();
  const addTask = useAddTask();
  const [generating, setGenerating] = useState(false);

  const platformCatalog = catalog.find(c => c.slug === platformSlug);
  const checklistItems: ChecklistItem[] = useMemo(() => {
    if (!platformCatalog) return [];
    const raw = platformCatalog.checklist_obrigatorio;
    if (!Array.isArray(raw)) return [];
    return (raw as any[]).map((item: any, idx: number) => ({
      id: item.id ?? `item-${idx}`,
      label: item.label ?? item.titulo ?? `Item ${idx + 1}`,
      etapa: item.etapa ?? 'implementacao',
      bloqueia_passagem: item.bloqueia_passagem ?? false,
      expectedDay: item.expectedDay ?? item.prazo_dias ?? (idx + 1) * 2,
      role: item.role ?? item.responsavel ?? 'auxiliar_ecommerce',
    }));
  }, [platformCatalog]);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelected(new Set(checklistItems.map(i => i.id)));
    }
  }, [open, checklistItems.length]);

  const findBestResponsible = (role: string): string => {
    const squadMembers = squadId
      ? teamMembers.filter(m => m.squadId === squadId)
      : teamMembers;
    
    const roleMap: Record<string, string[]> = {
      'auxiliar_ecommerce': ['auxiliar_ecommerce'],
      'assistente_ecommerce': ['assistente_ecommerce'],
      'cs': ['cs'],
      'manager': ['manager'],
      'operacional': ['operacional'],
    };
    
    const allowedRoles = roleMap[role] ?? [role];
    const candidates = squadMembers.filter(m => allowedRoles.includes(m.role));
    
    if (candidates.length === 0) {
      if (squadMembers.length > 0) {
        const sorted = [...squadMembers].sort((a, b) => a.currentLoad - b.currentLoad);
        return sorted[0].name;
      }
      return appUsers[0]?.name ?? '';
    }
    
    const sorted = [...candidates].sort((a, b) => a.currentLoad - b.currentLoad);
    return sorted[0].name;
  };

  const handleGenerate = async () => {
    const items = checklistItems.filter(i => selected.has(i.id));
    if (items.length === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    setGenerating(true);
    const baseDate = startDate ? new Date(startDate + 'T12:00:00') : new Date();
    const createdTaskIds: string[] = [];

    try {
      for (const item of items) {
        const taskId = crypto.randomUUID();
        const deadline = addBusinessDays(baseDate, item.expectedDay ?? 5);
        const responsible = findBestResponsible(item.role ?? 'auxiliar_ecommerce');

        await addTask.mutateAsync({
          id: taskId,
          title: `${item.label} - ${clientName}`,
          clientId,
          clientName,
          responsible,
          type: 'setup',
          estimatedTime: 1,
          deadline: deadline.toISOString().split('T')[0],
          status: 'backlog',
          priority: item.bloqueia_passagem ? 'high' : 'medium',
          comments: `Demanda automática - ${platformSlug}`,
          createdAt: new Date().toISOString(),
          platforms: [platformSlug],
          platformId,
          etapa: item.etapa,
          bloqueiaPassagem: item.bloqueia_passagem ?? false,
          origemTarefa: 'automatica',
          dependsOn: createdTaskIds.length > 0 ? [createdTaskIds[createdTaskIds.length - 1]] : [],
        } as any);

        createdTaskIds.push(taskId);
      }

      toast.success(`${items.length} demandas geradas automaticamente!`);
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao gerar demandas: ' + String(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            Gerar Demandas Automáticas
          </DialogTitle>
        </DialogHeader>

        {!platformCatalog ? (
          <p className="text-sm text-muted-foreground py-4">
            Nenhum catálogo encontrado para a plataforma "{platformSlug}". Configure o catálogo mestre primeiro.
          </p>
        ) : checklistItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            O catálogo da plataforma não possui itens de checklist configurados.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {checklistItems.length} demandas serão criadas para <strong>{clientName}</strong> na plataforma <strong>{platformCatalog.name}</strong>.
              Cada demanda será atribuída ao colaborador com menor carga de trabalho.
            </p>
            <div className="space-y-2 mt-3">
              {checklistItems.map((item) => (
                <label key={item.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={selected.has(item.id)}
                    onCheckedChange={(checked) => {
                      const next = new Set(selected);
                      if (checked) next.add(item.id);
                      else next.delete(item.id);
                      setSelected(next);
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{item.label}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {item.etapa}
                      </span>
                      {item.bloqueia_passagem && (
                        <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                          Bloqueia passagem
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        D{item.expectedDay}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || selected.size === 0 || !platformCatalog}
            className="gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Gerar {selected.size} Demandas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
