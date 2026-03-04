import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePhaseDemandsQuery } from '@/hooks/usePhaseDemandsQuery';
import { useFlowsQuery } from '@/hooks/useFlowsQuery';
import { useAddTask } from '@/hooks/useTasksQuery';
import { useClientStatusesQuery } from '@/hooks/useClientStatusesQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap, Settings, Workflow } from 'lucide-react';
import { PhaseDemandConfigDialog } from './PhaseDemandConfigDialog';

interface DemandRow {
  templateId: string;
  title: string;
  demandOwner: string;
  flowId: string | null;
  selected: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phase: string;
  clientId: string;
  clientName: string;
  platformSlug: string;
  squadId?: string | null;
}

export function GenerateDemandsDialog({ open, onOpenChange, phase, clientId, clientName, platformSlug }: Props) {
  const { data: templates = [] } = usePhaseDemandsQuery();
  const { data: flows = [] } = useFlowsQuery();
  const { data: clientStatuses = [] } = useClientStatusesQuery();
  const addTask = useAddTask();
  const [configOpen, setConfigOpen] = useState(false);
  const [rows, setRows] = useState<DemandRow[]>([]);
  const [selectedPhase, setSelectedPhase] = useState(phase);

  // Reset selectedPhase when dialog opens with a new phase prop
  useEffect(() => {
    if (open) setSelectedPhase(phase);
  }, [open, phase]);

  const phaseLabel = useMemo(() => {
    const found = clientStatuses.find(s => s.key === selectedPhase);
    return found?.label ?? selectedPhase;
  }, [clientStatuses, selectedPhase]);

  const phaseTemplates = useMemo(
    () => templates.filter((t) => t.phase === selectedPhase),
    [templates, selectedPhase]
  );

  // Sync rows when templates change — useEffect instead of render-time setState
  useEffect(() => {
    setRows(
      phaseTemplates.map((t) => ({
        templateId: t.id,
        title: t.title,
        demandOwner: t.demandOwner,
        flowId: t.flowId,
        selected: true,
      }))
    );
  }, [phaseTemplates]);

  const getFlowName = (flowId: string | null) => {
    if (!flowId) return null;
    return flows.find((f) => f.id === flowId)?.name ?? null;
  };

  const getFlowSteps = (flowId: string | null) => {
    if (!flowId) return [];
    return flows.find((f) => f.id === flowId)?.steps ?? [];
  };

  const updateRow = (idx: number, patch: Partial<DemandRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const selectedCount = rows.filter((r) => r.selected).length;
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const toCreate = rows.filter((r) => r.selected);
    if (!toCreate.length) return;
    setCreating(true);
    try {
      for (const row of toCreate) {
        const taskId = crypto.randomUUID();
        await addTask.mutateAsync({
          id: taskId,
          title: row.title,
          clientId,
          clientName,
          responsible: '',
          type: row.demandOwner === 'client' ? 'reuniao' : 'setup',
          estimatedTime: 0,
          deadline: new Date().toISOString().split('T')[0],
          status: phase,
          priority: 'medium',
          comments: `Gerada automaticamente - Fase: ${phaseLabel}`,
          createdAt: new Date().toISOString(),
          platforms: [platformSlug],
        });

        // Create subtasks from flow steps
        const steps = getFlowSteps(row.flowId);
        if (steps.length > 0) {
          const subtasks = steps.map((label, idx) => ({
            task_id: taskId,
            label,
            done: false,
          }));
          await supabase.from('subtasks').insert(subtasks);
        }
      }
      toast.success(`${toCreate.length} demandas criadas com sucesso!`);
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao criar demandas');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Gerar Demandas — {phaseLabel}
            </DialogTitle>
          </DialogHeader>

          {phaseTemplates.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma demanda padrão configurada para a fase <strong>{phaseLabel}</strong>.
              </p>
              <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
                <Settings className="w-4 h-4 mr-1" />
                Configurar Templates
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{selectedCount} de {rows.length} selecionadas</p>
                <Button variant="ghost" size="sm" onClick={() => setConfigOpen(true)}>
                  <Settings className="w-3.5 h-3.5 mr-1" />
                  Editar Templates
                </Button>
              </div>

              {rows.map((row, idx) => {
                const flowName = getFlowName(row.flowId);
                return (
                  <div key={row.templateId} className={`rounded-lg border p-3 transition-colors ${row.selected ? 'bg-card border-border' : 'bg-muted/30 border-transparent opacity-60'}`}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={(v) => updateRow(idx, { selected: !!v })}
                      />
                      <span className="text-sm font-medium flex-1">{row.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${row.demandOwner === 'client' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                        {row.demandOwner === 'client' ? 'Cliente' : 'Interna'}
                      </span>
                      {flowName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-0.5">
                          <Workflow className="w-3 h-3" />
                          {flowName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {phaseTemplates.length > 0 && (
              <Button
                onClick={handleCreate}
                disabled={!selectedCount || creating}
              >
                <Zap className="w-4 h-4 mr-1" />
                {creating ? 'Criando...' : `Criar ${selectedCount} Demandas`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PhaseDemandConfigDialog open={configOpen} onOpenChange={setConfigOpen} />
    </>
  );
}
