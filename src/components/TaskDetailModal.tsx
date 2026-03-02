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
import { cn } from '@/lib/utils';
import { Send, Clock, User, CalendarDays, Flag, MessageSquare, Trash2, Tag, Briefcase, ShoppingBag, Workflow } from 'lucide-react';
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
  const { updateTask, deleteTask, flows } = useTasks();
  const { currentUser } = useAuth();
  const { squads } = useSquads();
  const { clients } = useClients();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: platforms = [] } = usePlatformsQuery();
  const { data: taskTypes = [] } = useTaskTypesQuery();
  const taskTypeMap = useTaskTypesMap();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const canDelete = useMemo(() => {
    if (!currentUser || !task) return false;
    if (currentUser.accessLevel === 3) return true;
    const client = clients.find((c) => c.id === task.clientId);
    if (!client) return false;
    const squad = squads.find((s) => s.id === client.squadId);
    return squad?.leader === currentUser.name;
  }, [currentUser, task, clients, squads]);

  if (!task) return null;

  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;
  const chatNotes = task.chatNotes ?? [];
  const priorityConf = priorityConfig[task.priority] ?? { label: task.priority, className: '', icon: '●' };
  const typeConf = taskTypeMap[task.type] ?? { label: task.type, color: 'bg-gray-100 text-gray-700' };
  const isLate = new Date(task.deadline) < new Date() && task.status !== 'done';

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

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask(task.id, { title: trimmed });
    }
    setEditingTitle(false);
  };

  const deadlineISO = task.deadline ? task.deadline.slice(0, 10) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0">
        {/* Header with title and type badge */}
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  className="text-lg font-semibold mb-2"
                />
              ) : (
                <DialogTitle
                  className="text-lg leading-snug mb-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                >
                  {task.title}
                </DialogTitle>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type - editable select */}
                <Select value={task.type} onValueChange={(v) => updateTask(task.id, { type: v as TaskType })}>
                  <SelectTrigger className={cn('h-7 w-auto text-xs px-2 py-0.5 rounded-md font-medium border-0', typeConf.color)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((t) => (
                      <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            {/* Responsável - editable with app_users */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <User className="w-3.5 h-3.5" />
                Responsável
              </div>
              <Select value={task.responsible} onValueChange={(v) => updateTask(task.id, { responsible: v })}>
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
            </div>

            {/* Prazo - editable */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <CalendarDays className="w-3.5 h-3.5" />
                Prazo
              </div>
              <Input
                type="date"
                value={deadlineISO}
                onChange={(e) => {
                  if (e.target.value) updateTask(task.id, { deadline: e.target.value });
                }}
                className={cn('h-9 bg-background border-border', isLate && 'text-destructive')}
              />
            </div>

            {/* Prioridade - editable */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <Flag className="w-3.5 h-3.5" />
                Prioridade
              </div>
              <Select value={task.priority} onValueChange={(v) => updateTask(task.id, { priority: v as Priority })}>
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
            </div>

            {/* Plataformas - editable multi-select */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <ShoppingBag className="w-3.5 h-3.5" />
                Plataformas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {platforms.map((p) => {
                  const active = (task.platforms ?? []).includes(p.slug);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const current = task.platforms ?? [];
                        const updated = active ? current.filter(s => s !== p.slug) : [...current, p.slug];
                        updateTask(task.id, { platforms: updated } as any);
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
              </div>
            </div>

            {/* Tempo - editable */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" />
                Tempo
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Estimado (h)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={task.estimatedTime}
                    onChange={(e) => updateTask(task.id, { estimatedTime: parseFloat(e.target.value) || 0 })}
                    className="h-8 bg-background border-border text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Real (h)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={task.realTime ?? ''}
                    onChange={(e) => updateTask(task.id, { realTime: e.target.value ? parseFloat(e.target.value) : null })}
                    className="h-8 bg-background border-border text-sm"
                  />
                </div>
              </div>
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

          {/* Aplicar Fluxo */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Aplicar Fluxo
            </h4>
            {flows.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum fluxo cadastrado.</p>
            ) : (
              <Select
                value=""
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
