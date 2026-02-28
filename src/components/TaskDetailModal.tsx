import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Task, ChatNote } from '@/types';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSquads } from '@/contexts/SquadsContext';
import { useClients } from '@/contexts/ClientsContext';
import { priorityConfig, taskTypeConfig, taskStatusConfig } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Send, Clock, User, CalendarDays, Flag, MessageSquare, Trash2, Tag, Briefcase } from 'lucide-react';
import { Avatar } from '@/components/ui/shared';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const { updateTask, deleteTask } = useTasks();
  const { currentUser } = useAuth();
  const { squads } = useSquads();
  const { clients } = useClients();
  const [newNote, setNewNote] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.chatNotes?.length]);

  const squadMembers = useMemo(() => {
    if (!task) return [];
    const client = clients.find((c) => c.id === task.clientId);
    if (!client) return [];
    const squad = squads.find((s) => s.id === client.squadId);
    return squad?.members ?? [];
  }, [task, squads]);

  if (!task) return null;

  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;
  const chatNotes = task.chatNotes ?? [];
  const priorityConf = priorityConfig[task.priority];
  const typeConf = taskTypeConfig[task.type];
  const isLate = new Date(task.deadline) < new Date() && task.status !== 'done';

  const canDelete = (() => {
    if (!currentUser) return false;
    if (currentUser.accessLevel === 3) return true;
    const client = clients.find((c) => c.id === task.clientId);
    if (!client) return false;
    const squad = squads.find((s) => s.id === client.squadId);
    return squad?.leader === currentUser.name;
  })();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0">
        {/* Header with title and type badge */}
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-snug mb-2">{task.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', typeConf.color)}>
                  {typeConf.label}
                </span>
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
            {/* Responsável - editable */}
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
                  {squadMembers.map((m) => (
                    <SelectItem key={m} value={m}>
                      <div className="flex items-center gap-2">
                        <Avatar name={m} size="sm" />
                        {m}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prazo */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <CalendarDays className="w-3.5 h-3.5" />
                Prazo
              </div>
              <p className={cn('text-sm font-semibold', isLate ? 'text-destructive' : 'text-foreground')}>
                {new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Prioridade */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <Flag className="w-3.5 h-3.5" />
                Prioridade
              </div>
              <span className={cn('inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-lg font-semibold border', priorityConf.className)}>
                {priorityConf.icon} {priorityConf.label}
              </span>
            </div>

            {/* Tempo */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" />
                Tempo
              </div>
              <div className="text-sm font-semibold text-foreground">
                {task.estimatedTime}h estimado
                {task.realTime != null && (
                  <span className="text-muted-foreground font-normal"> · {task.realTime}h real</span>
                )}
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

            {/* Comments field (task.comments) */}
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
