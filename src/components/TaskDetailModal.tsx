import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Task, ChatNote, Priority, TaskType } from '@/types';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSquads } from '@/contexts/SquadsContext';
import { useClients } from '@/contexts/ClientsContext';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { priorityConfig } from '@/lib/config';
import { useTaskTypesQuery, useTaskTypesMap } from '@/hooks/useTaskTypesQuery';
import { useActiveDelayReasons } from '@/hooks/useDelayReasonsQuery';
import { MOTIVO_ATRASO_OPTIONS } from '@/lib/platformUtils';
import { cn, hoursToHM, hmToHours } from '@/lib/utils';
import { Send, Clock, User, CalendarDays, Flag, MessageSquare, Trash2, Briefcase, ShoppingBag, Workflow, Pencil, Save, X, AlertTriangle } from 'lucide-react';
import { Avatar } from '@/components/ui/shared';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const { updateTask, deleteTask, flows, tasks: allTasks } = useTasks();
  const { currentUser } = useAuth();
  const { squads } = useSquads();
  const { clients } = useClients();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: platforms = [] } = usePlatformsQuery();
  const { data: taskTypes = [] } = useTaskTypesQuery();
  const taskTypeMap = useTaskTypesMap();
  const queryClient = useQueryClient();
  const activeDelayReasons = useActiveDelayReasons();
  const [newNote, setNewNote] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftType, setDraftType] = useState('');
  const [draftResponsible, setDraftResponsible] = useState('');
  const [draftDeadline, setDraftDeadline] = useState('');
  const [draftPriority, setDraftPriority] = useState<Priority>('medium');
  const [draftPlatforms, setDraftPlatforms] = useState<string[]>([]);
  const [draftEstimatedTime, setDraftEstimatedTime] = useState(0);
  const [draftRealTime, setDraftRealTime] = useState<number | null>(null);

  // Reset editing when task changes or modal closes
  useEffect(() => {
    if (!open) setEditing(false);
  }, [open, task?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.chatNotes?.length]);

  const responsibleOptions = useMemo(() => {
    if (!task) return appUsers;
    const client = clients.find((c) => c.id === task.clientId);
    if (!client?.squadId) return appUsers;
    const filtered = appUsers.filter(u => u.squadIds?.includes(client.squadId!));
    return filtered.length > 0 ? filtered : appUsers;
  }, [task, clients, appUsers]);

  const canDelete = !!currentUser && !!task;

  if (!task) return null;

  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;
  const chatNotes = task.chatNotes ?? [];
  const priorityConf = priorityConfig[task.priority] ?? { label: task.priority, className: '', icon: '●' };
  const typeConf = taskTypeMap[task.type] ?? { label: task.type, color: 'bg-gray-100 text-gray-700' };
  const isLate = new Date(task.deadline) < new Date() && task.status !== 'done';
  const deadlineISO = task.deadline ? task.deadline.slice(0, 10) : '';

  const enterEditMode = () => {
    setDraftTitle(task.title);
    setDraftType(task.type);
    setDraftResponsible(task.responsible);
    setDraftDeadline(deadlineISO);
    setDraftPriority(task.priority);
    setDraftPlatforms(task.platforms ?? []);
    setDraftEstimatedTime(task.estimatedTime);
    setDraftRealTime(task.realTime ?? null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = () => {
    updateTask(task.id, {
      title: draftTitle.trim() || task.title,
      type: draftType as TaskType,
      responsible: draftResponsible,
      deadline: draftDeadline,
      priority: draftPriority,
      platforms: draftPlatforms,
      estimatedTime: draftEstimatedTime,
      realTime: draftRealTime,
    } as any);
    setEditing(false);
    toast.success('Demanda atualizada');
  };

  const toggleSubtask = (subtaskId: string) => {
    const userName = currentUser?.name ?? 'Usuário';
    const now = new Date().toISOString();
    const updated = subtasks.map((s) =>
      s.id === subtaskId
        ? { ...s, done: !s.done, checkedBy: !s.done ? userName : undefined, checkedAt: !s.done ? now : undefined }
        : s
    );
    updateTask(task.id, { subtasks: updated });
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: ChatNote = {
      id: `cn_${Date.now()}`,
      message: newNote.trim(),
      author: currentUser?.name ?? 'Usuário',
      createdAt: new Date().toISOString(),
    };
    updateTask(task.id, { chatNotes: [...chatNotes, note] });
    setNewNote('');
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onOpenChange(false);
  };

  // Draft helpers for time fields
  const draftEstHM = hoursToHM(draftEstimatedTime);
  const draftRealHM = draftRealTime != null ? hoursToHM(draftRealTime) : { h: 0, m: 0 };
  const taskEstHM = hoursToHM(task.estimatedTime);
  const taskRealHM = task.realTime != null ? hoursToHM(task.realTime) : null;

  // Display helpers for readonly priority
  const displayPriorityConf = editing
    ? (priorityConfig[draftPriority] ?? priorityConf)
    : priorityConf;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input
                  autoFocus
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="text-lg font-semibold mb-2"
                />
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <DialogTitle className="text-lg leading-snug">
                    {task.title}
                  </DialogTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={enterEditMode}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type */}
                {editing ? (
                  <Select value={draftType} onValueChange={setDraftType}>
                    <SelectTrigger className={cn('h-7 w-auto text-xs px-2 py-0.5 rounded-md font-medium border-0', (taskTypeMap[draftType] ?? typeConf).color)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((t) => (
                        <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={cn('h-7 inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium', typeConf.color)}>
                    {typeConf.label}
                  </span>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {task.clientName}
                </span>
                {isLate && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-destructive/10 text-destructive border border-destructive/20">
                    Atrasada
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 pt-4">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Responsável */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <User className="w-3.5 h-3.5" />
                Responsável
              </div>
              {editing ? (
                <Select value={draftResponsible} onValueChange={setDraftResponsible}>
                  <SelectTrigger className="h-9 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {responsibleOptions.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        <div className="flex items-center gap-2">
                          <Avatar name={u.name} size="sm" />
                          {u.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 h-9 px-1">
                  <Avatar name={task.responsible} size="sm" />
                  <span className="text-sm font-medium text-foreground">{task.responsible}</span>
                </div>
              )}
            </div>

            {/* Prazo */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <CalendarDays className="w-3.5 h-3.5" />
                Prazo
              </div>
              {editing ? (
                <Input
                  type="date"
                  value={draftDeadline}
                  onChange={(e) => setDraftDeadline(e.target.value)}
                  className={cn('h-9 bg-background border-border', isLate && 'text-destructive')}
                />
              ) : (
                <p className={cn('text-sm font-medium h-9 flex items-center px-1', isLate && 'text-destructive')}>
                  {deadlineISO ? new Date(deadlineISO + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </p>
              )}
            </div>

            {/* Prioridade */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <Flag className="w-3.5 h-3.5" />
                Prioridade
              </div>
              {editing ? (
                <Select value={draftPriority} onValueChange={(v) => setDraftPriority(v as Priority)}>
                  <SelectTrigger className="h-9 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-1.5">{conf.icon} {conf.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium h-9 flex items-center gap-1.5 px-1">
                  {priorityConf.icon} {priorityConf.label}
                </p>
              )}
            </div>

            {/* Plataformas */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <ShoppingBag className="w-3.5 h-3.5" />
                Plataformas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editing ? (
                  <>
                    {platforms.map((p) => {
                      const active = draftPlatforms.includes(p.slug);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setDraftPlatforms(active ? draftPlatforms.filter(s => s !== p.slug) : [...draftPlatforms, p.slug]);
                          }}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                            active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                          )}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                    {platforms.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma plataforma cadastrada</span>}
                  </>
                ) : (
                  <>
                    {(task.platforms ?? []).length > 0 ? (
                      (task.platforms ?? []).map((slug) => {
                        const p = platforms.find(pl => pl.slug === slug);
                        return (
                          <span key={slug} className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {p?.name ?? slug}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Motivo de Atraso — visible when late */}
            {isLate && (
              <div className="bg-destructive/5 rounded-xl p-3 space-y-1.5 col-span-2 border border-destructive/20">
                <div className="flex items-center gap-1.5 text-xs text-destructive font-medium uppercase tracking-wide">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Motivo de Atraso
                </div>
                <select
                  value={(task as any).motivoAtraso ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    // Save immediately via supabase
                    supabase.from('tasks').update({ motivo_atraso: val }).eq('id', task.id)
                      .then(({ error }) => {
                        if (error) { toast.error('Erro ao salvar motivo'); return; }
                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                      });
                  }}
                  className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                >
                  <option value="">— Selecione o motivo —</option>
                  {(activeDelayReasons.length > 0 ? activeDelayReasons.map(r => r.label) : MOTIVO_ATRASO_OPTIONS as unknown as string[]).map(o =>
                    <option key={o} value={o}>{o}</option>
                  )}
                </select>
              </div>
            )}

            {/* Tempo */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" />
                Tempo
              </div>
              {editing ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Estimado</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input type="number" min={0} className="h-8 bg-background border-border text-sm" value={draftEstHM.h} onChange={(e) => setDraftEstimatedTime(hmToHours(parseInt(e.target.value) || 0, draftEstHM.m))} />
                        <span className="text-[10px] text-muted-foreground">h</span>
                      </div>
                      <div className="flex-1">
                        <Input type="number" min={0} max={59} step={5} className="h-8 bg-background border-border text-sm" value={draftEstHM.m} onChange={(e) => setDraftEstimatedTime(hmToHours(draftEstHM.h, Math.min(59, parseInt(e.target.value) || 0)))} />
                        <span className="text-[10px] text-muted-foreground">min</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Real</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input type="number" min={0} className="h-8 bg-background border-border text-sm" value={draftRealTime != null ? draftRealHM.h : ''} onChange={(e) => { const v = parseInt(e.target.value); if (isNaN(v)) { setDraftRealTime(null); return; } setDraftRealTime(hmToHours(v, draftRealTime != null ? draftRealHM.m : 0)); }} />
                        <span className="text-[10px] text-muted-foreground">h</span>
                      </div>
                      <div className="flex-1">
                        <Input type="number" min={0} max={59} step={5} className="h-8 bg-background border-border text-sm" value={draftRealTime != null ? draftRealHM.m : ''} onChange={(e) => { const v = parseInt(e.target.value); if (isNaN(v)) { setDraftRealTime(null); return; } setDraftRealTime(hmToHours(draftRealTime != null ? draftRealHM.h : 0, Math.min(59, v))); }} />
                        <span className="text-[10px] text-muted-foreground">min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 px-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground text-xs">Estimado: </span>
                    <span className="font-medium">{taskEstHM.h}h {taskEstHM.m > 0 ? `${taskEstHM.m}min` : ''}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground text-xs">Real: </span>
                    <span className="font-medium">{taskRealHM ? `${taskRealHM.h}h ${taskRealHM.m > 0 ? `${taskRealHM.m}min` : ''}` : '—'}</span>
                  </p>
                </div>
              )}
              {isLate && (() => {
                const diffMs = new Date().getTime() - new Date(task.deadline).getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                return (
                  <p className="text-xs text-destructive font-medium mt-1">
                    ⚠ {diffHours}h de atraso
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Entrega — visible for revisao/aguardando_aprovacao/done */}
          {(task.status === 'revisao' || task.status === 'aguardando_aprovacao' || task.status === 'done') && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                📦 Entrega
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Link de entrega</label>
                  <Input
                    value={(task as any).linkEntrega ?? ''}
                    onChange={(e) => {
                      supabase.from('tasks').update({ link_entrega: e.target.value } as any).eq('id', task.id)
                        .then(({ error }) => {
                          if (!error) queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        });
                    }}
                    placeholder="https://..."
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Print de entrega (URL)</label>
                  <Input
                    value={(task as any).printEntrega ?? ''}
                    onChange={(e) => {
                      supabase.from('tasks').update({ print_entrega: e.target.value } as any).eq('id', task.id)
                        .then(({ error }) => {
                          if (!error) queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        });
                    }}
                    placeholder="URL da imagem..."
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Observação de entrega</label>
                  <Input
                    value={(task as any).observacaoEntrega ?? ''}
                    onChange={(e) => {
                      supabase.from('tasks').update({ observacao_entrega: e.target.value } as any).eq('id', task.id)
                        .then(({ error }) => {
                          if (!error) queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        });
                    }}
                    placeholder="Comentário sobre a entrega..."
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Nota (0-10)</label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={(task as any).notaEntrega ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      supabase.from('tasks').update({ nota_entrega: val } as any).eq('id', task.id)
                        .then(({ error }) => {
                          if (!error) queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        });
                    }}
                    className="h-8 text-sm w-24"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dependências */}
          {(task as any).dependsOn?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                🔗 Dependências
              </h4>
              <div className="space-y-1.5">
                {((task as any).dependsOn as string[]).map((depId: string) => {
                  const depTask = allTasks?.find((t: any) => t.id === depId);
                  const isDone = depTask?.status === 'done' && (depTask as any)?.approvalStatus === 'approved';
                  return (
                    <div key={depId} className={cn(
                      'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border',
                      isDone ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning'
                    )}>
                      <span>{isDone ? '✅' : '⏳'}</span>
                      <span className="truncate">{depTask?.title ?? depId}</span>
                      <span className="text-[10px] ml-auto">{depTask?.status ?? 'desconhecido'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Aplicar Fluxo
            </h4>
            {flows.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum fluxo cadastrado.</p>
            ) : (
              <Select
                value={task.flowId ?? ""}
                onValueChange={async (flowId) => {
                  const flow = flows.find(f => f.id === flowId);
                  if (!flow || !task) return;
                  const newSubtasks = flow.steps.map((step) => ({
                    id: crypto.randomUUID(),
                    task_id: task.id,
                    label: step,
                    done: false,
                    checked_by: null,
                    checked_at: null,
                  }));
                  const { error } = await supabase.from('subtasks').insert(newSubtasks);
                  if (error) {
                    toast.error('Erro ao aplicar fluxo');
                    return;
                  }
                  updateTask(task.id, { flowId } as any);
                  queryClient.invalidateQueries({ queryKey: ['tasks'] });
                  toast.success(`Fluxo "${flow.name}" aplicado com ${flow.steps.length} etapas`);
                }}
              >
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="Selecione um fluxo para aplicar..." />
                </SelectTrigger>
                <SelectContent>
                  {flows.map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name} ({flow.steps.length} etapas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Subtarefas</h4>
                <span className="text-xs text-muted-foreground font-medium">{doneCount}/{subtasks.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="space-y-2">
                {subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={st.done}
                      onCheckedChange={() => toggleSubtask(st.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-sm', st.done && 'line-through text-muted-foreground')}>
                        {st.label}
                      </span>
                      {st.done && st.checkedBy && st.checkedAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ✓ {st.checkedBy} · {new Date(st.checkedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Observações / Chat Notes */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Observações
            </h4>

            {task.comments && (
              <div className="bg-accent/30 rounded-lg p-3 text-sm text-foreground border border-accent/50">
                {task.comments}
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chatNotes.length === 0 && !task.comments && (
                <p className="text-xs text-muted-foreground italic">Nenhuma observação ainda.</p>
              )}
              {chatNotes.map((note) => (
                <div key={note.id} className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{note.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{note.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          {editing ? (
            <>
              <Button variant="ghost" onClick={cancelEdit} className="gap-1.5">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <div className="flex-1" />
              <Button onClick={saveEdit} className="gap-1.5">
                <Save className="w-4 h-4" />
                Salvar
              </Button>
            </>
          ) : (
            <>
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir demanda</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir "{task.title}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Input
                placeholder="Adicionar observação..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNote()}
                className="flex-1"
              />
              <Button size="icon" onClick={addNote} disabled={!newNote.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
