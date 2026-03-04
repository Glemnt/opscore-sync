import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePhaseDemandsQuery, useAddPhaseDemand, useDeletePhaseDemand } from '@/hooks/usePhaseDemandsQuery';
import { useTaskStatusesQuery } from '@/hooks/useTaskStatusesQuery';
import { useFlowsQuery } from '@/hooks/useFlowsQuery';
import { Trash2, Plus, Workflow } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialPhase?: string;
}

export function PhaseDemandConfigDialog({ open, onOpenChange, initialPhase }: Props) {
  const { data: taskStatuses = [] } = useTaskStatusesQuery();
  const { data: flows = [] } = useFlowsQuery();
  const [selectedPhase, setSelectedPhase] = useState(initialPhase || '');

  useEffect(() => {
    if (open && initialPhase) setSelectedPhase(initialPhase);
  }, [open, initialPhase]);
  const [newOwner, setNewOwner] = useState<'internal' | 'client'>('internal');
  const [newFlowId, setNewFlowId] = useState<string>('');
  const { data: templates = [] } = usePhaseDemandsQuery();
  const addMutation = useAddPhaseDemand();
  const deleteMutation = useDeletePhaseDemand();

  const filtered = templates.filter((t) => t.phase === selectedPhase);

  const handleAdd = () => {
    if (!newFlowId) {
      toast.error('Selecione um fluxo');
      return;
    }
    const flow = flows.find((f) => f.id === newFlowId);
    if (!flow) return;
    addMutation.mutate(
      { phase: selectedPhase, title: flow.name, demandOwner: newOwner, flowId: newFlowId },
      {
        onSuccess: () => {
          setNewFlowId('');
          toast.success('Template adicionado');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => toast.success('Template removido') });
  };

  const getFlowName = (flowId: string | null) => {
    if (!flowId) return null;
    return flows.find((f) => f.id === flowId)?.name ?? null;
  };

  const getFlowSteps = (flowId: string | null) => {
    if (!flowId) return [];
    return flows.find((f) => f.id === flowId)?.steps ?? [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Demandas por Fase</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Fase</Label>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger><SelectValue placeholder="Selecionar status..." /></SelectTrigger>
              <SelectContent>
                {taskStatuses.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Templates cadastrados ({filtered.length})</Label>
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum template cadastrado para esta fase.</p>
            )}
            {filtered.map((t) => {
              const flowName = getFlowName(t.flowId);
              const steps = getFlowSteps(t.flowId);
              return (
                <div key={t.id} className="bg-muted/40 rounded-lg px-3 py-2 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-primary" />
                    <span className="flex-1 font-medium">{flowName ?? t.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${t.demandOwner === 'client' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                      {t.demandOwner === 'client' ? 'Cliente' : 'Interna'}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                  {steps.length > 0 && (
                    <div className="pl-6 text-xs text-muted-foreground space-y-0.5">
                      {steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="w-4 text-right text-[10px] opacity-60">{i + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <Label>Adicionar novo template</Label>
            <div className="flex gap-2">
              <Select value={newFlowId} onValueChange={setNewFlowId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar fluxo..." />
                </SelectTrigger>
                <SelectContent>
                  {flows.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name} ({f.steps.length} etapas)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newOwner} onValueChange={(v) => setNewOwner(v as 'internal' | 'client')}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interna</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAdd} disabled={!newFlowId || addMutation.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
