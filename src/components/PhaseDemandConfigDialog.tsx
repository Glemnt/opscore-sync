import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [newTitle, setNewTitle] = useState('');
  const [newOwner, setNewOwner] = useState<'internal' | 'client'>('internal');
  const [newFlowId, setNewFlowId] = useState<string>('');
  const { data: templates = [] } = usePhaseDemandsQuery();
  const addMutation = useAddPhaseDemand();
  const deleteMutation = useDeletePhaseDemand();

  const filtered = templates.filter((t) => t.phase === selectedPhase);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addMutation.mutate(
      { phase: selectedPhase, title: newTitle.trim(), demandOwner: newOwner, flowId: newFlowId || null },
      {
        onSuccess: () => {
          setNewTitle('');
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
            <Label>Demandas cadastradas ({filtered.length})</Label>
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma demanda cadastrada para esta fase.</p>
            )}
            {filtered.map((t) => {
              const flowName = getFlowName(t.flowId);
              return (
                <div key={t.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 text-sm">
                  <span className="flex-1">{t.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${t.demandOwner === 'client' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                    {t.demandOwner === 'client' ? 'Cliente' : 'Interna'}
                  </span>
                  {flowName && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-0.5">
                      <Workflow className="w-3 h-3" />
                      {flowName}
                    </span>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <Label>Adicionar nova demanda</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Título da demanda"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Select value={newOwner} onValueChange={(v) => setNewOwner(v as 'internal' | 'client')}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interna</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Select value={newFlowId} onValueChange={setNewFlowId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Fluxo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {flows.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim() || addMutation.isPending}>
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
