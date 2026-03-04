import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { usePhaseDemandsQuery } from '@/hooks/usePhaseDemandsQuery';
import { useAddTask } from '@/hooks/useTasksQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useTaskStatusesQuery } from '@/hooks/useTaskStatusesQuery';
import { useSquads } from '@/contexts/SquadsContext';
import { toast } from 'sonner';
import { Zap, Settings } from 'lucide-react';
import { PhaseDemandConfigDialog } from './PhaseDemandConfigDialog';

interface DemandRow {
  templateId: string;
  title: string;
  demandOwner: string;
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


export function GenerateDemandsDialog({ open, onOpenChange, phase, clientId, clientName, platformSlug, squadId }: Props) {
  const { data: templates = [] } = usePhaseDemandsQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: taskStatuses = [] } = useTaskStatusesQuery();
  const { squads } = useSquads();
  const addTask = useAddTask();
  const [configOpen, setConfigOpen] = useState(false);

  const phaseLabel = useMemo(() => {
    const found = taskStatuses.find(s => s.key === phase);
    return found?.label ?? phase;
  }, [taskStatuses, phase]);

  const phaseTemplates = useMemo(
    () => templates.filter((t) => t.phase === phase),
    [templates, phase]
  );

  const [rows, setRows] = useState<DemandRow[]>([]);

  // Sync rows when templates change
  const templateIds = phaseTemplates.map((t) => t.id).join(',');
  const [prevIds, setPrevIds] = useState('');
  if (templateIds !== prevIds) {
    setPrevIds(templateIds);
    setRows(
      phaseTemplates.map((t) => ({
        templateId: t.id,
        title: t.title,
        demandOwner: t.demandOwner,
        selected: true,
        responsible: '',
        deadline: '',
      }))
    );
  }

  // Members from the squad
  const squadMembers = useMemo(() => {
    if (!squadId) return appUsers;
    const squad = squads.find((s) => s.id === squadId);
    if (!squad) return appUsers;
    return appUsers.filter((u) => squad.members.includes(u.name));
  }, [squadId, squads, appUsers]);

  const updateRow = (idx: number, patch: Partial<DemandRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const selectedCount = rows.filter((r) => r.selected).length;
  const allHaveFields = rows.filter((r) => r.selected).every((r) => r.responsible && r.deadline);

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
          status: phase,
          priority: 'medium',
          comments: `Gerada automaticamente - Fase: ${phaseLabel}`,
          createdAt: new Date().toISOString(),
          platforms: [platformSlug],
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

              {rows.map((row, idx) => (
                <div key={row.templateId} className={`rounded-lg border p-3 space-y-2 transition-colors ${row.selected ? 'bg-card border-border' : 'bg-muted/30 border-transparent opacity-60'}`}>
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
                    <div className="flex gap-3 pl-6">
                      <div className="flex-1">
                        <Label className="text-[10px] text-muted-foreground">Responsável</Label>
                        <Select value={row.responsible} onValueChange={(v) => updateRow(idx, { responsible: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {squadMembers.map((u) => (
                              <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-40">
                        <Label className="text-[10px] text-muted-foreground">Prazo</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={row.deadline}
                          onChange={(e) => updateRow(idx, { deadline: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {phaseTemplates.length > 0 && (
              <Button
                onClick={handleCreate}
                disabled={!selectedCount || !allHaveFields || creating}
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
