import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePhaseDemandsQuery } from '@/hooks/usePhaseDemandsQuery';
import { useFlowsQuery } from '@/hooks/useFlowsQuery';
import { useAddTask } from '@/hooks/useTasksQuery';
import { useTaskStatusesQuery } from '@/hooks/useTaskStatusesQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { toast } from 'sonner';
import { Zap, Settings, Workflow } from 'lucide-react';
import { PhaseDemandConfigDialog } from './PhaseDemandConfigDialog';

interface DemandRow {
  templateId: string;
  title: string;
  demandOwner: string;
  flowId: string | null;
  flowName: string;
  selected: boolean;
  responsible: string;
  deadline: string;
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
  const { data: taskStatuses = [] } = useTaskStatusesQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const addTask = useAddTask();
  const [configOpen, setConfigOpen] = useState(false);
  const [rows, setRows] = useState<DemandRow[]>([]);
  const [selectedPhase, setSelectedPhase] = useState(phase);

  useEffect(() => {
    if (open) setSelectedPhase('');
  }, [open]);

  const phaseLabel = useMemo(() => {
    const found = taskStatuses.find(s => s.key === selectedPhase);
    return found?.label ?? selectedPhase;
  }, [taskStatuses, selectedPhase]);

  const phaseTemplates = useMemo(
    () => templates.filter((t) => t.phase === selectedPhase),
    [templates, selectedPhase]
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Expand templates: 1 row per flow step
  useEffect(() => {
    const expanded: DemandRow[] = [];
    for (const t of phaseTemplates) {
      const flow = flows.find((f) => f.id === t.flowId);
      if (flow && flow.steps.length > 0) {
        for (const step of flow.steps) {
          expanded.push({
            templateId: t.id,
            title: step,
            demandOwner: t.demandOwner,
            flowId: flow.id,
            flowName: flow.name,
            selected: true,
            responsible: '',
            deadline: todayStr,
          });
        }
      } else {
        // Fallback: template without valid flow (shouldn't happen with new config)
        expanded.push({
          templateId: t.id,
          title: t.title,
          demandOwner: t.demandOwner,
          flowId: t.flowId,
          flowName: '',
          selected: true,
          responsible: '',
          deadline: todayStr,
        });
      }
    }
    setRows(expanded);
  }, [phaseTemplates, flows]);

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
        await addTask.mutateAsync({
          id: crypto.randomUUID(),
          title: row.title,
          clientId,
          clientName,
          responsible: row.responsible,
          type: row.demandOwner === 'client' ? 'reuniao' : 'setup',
          estimatedTime: 0,
          deadline: row.deadline,
          status: selectedPhase,
          priority: 'medium',
          comments: `Gerada automaticamente - Fase: ${phaseLabel}${row.flowName ? ` | Fluxo: ${row.flowName}` : ''}`,
          createdAt: new Date().toISOString(),
          platforms: [platformSlug],
          flowId: row.flowId ?? undefined,
        });
      }
      toast.success(`${toCreate.length} demandas criadas com sucesso!`);
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao criar demandas');
    } finally {
      setCreating(false);
    }
  };

  // Group rows by flow for visual grouping
  const groupedRows = useMemo(() => {
    const groups: { flowName: string; flowId: string | null; indices: number[] }[] = [];
    let currentGroup: typeof groups[0] | null = null;
    rows.forEach((row, idx) => {
      if (!currentGroup || currentGroup.flowId !== row.flowId || currentGroup.flowName !== row.flowName) {
        currentGroup = { flowName: row.flowName, flowId: row.flowId, indices: [idx] };
        groups.push(currentGroup);
      } else {
        currentGroup.indices.push(idx);
      }
    });
    return groups;
  }, [rows]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Gerar Demandas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1">
            <label className="text-sm font-medium">Fase da pipeline</label>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fase" />
              </SelectTrigger>
              <SelectContent>
                {taskStatuses.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{selectedCount} de {rows.length} selecionadas</p>
                <Button variant="ghost" size="sm" onClick={() => setConfigOpen(true)}>
                  <Settings className="w-3.5 h-3.5 mr-1" />
                  Editar Templates
                </Button>
              </div>

              {groupedRows.map((group) => (
                <div key={`${group.flowId}-${group.indices[0]}`} className="space-y-1">
                  {group.flowName && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-1">
                      <Workflow className="w-3.5 h-3.5" />
                      {group.flowName}
                    </div>
                  )}
                  {group.indices.map((idx) => {
                    const row = rows[idx];
                    return (
                      <div key={idx} className={`rounded-lg border p-3 transition-colors space-y-2 ${row.selected ? 'bg-card border-border' : 'bg-muted/30 border-transparent opacity-60'}`}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={row.selected}
                            onCheckedChange={(v) => updateRow(idx, { selected: !!v })}
                          />
                          <span className="text-sm font-medium flex-1">{row.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${row.demandOwner === 'client' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                            {row.demandOwner === 'client' ? 'Cliente' : 'Interna'}
                          </span>
                        </div>
                        {row.selected && (
                          <div className="flex items-center gap-2 pl-6">
                            <Select value={row.responsible} onValueChange={(v) => updateRow(idx, { responsible: v })}>
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue placeholder="Responsável" />
                              </SelectTrigger>
                              <SelectContent>
                                {appUsers.map((u) => (
                                  <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={row.deadline}
                              onChange={(e) => updateRow(idx, { deadline: e.target.value })}
                              className="h-8 text-xs w-36"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
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

      <PhaseDemandConfigDialog open={configOpen} onOpenChange={setConfigOpen} initialPhase={selectedPhase} />
    </>
  );
}
