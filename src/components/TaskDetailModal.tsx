import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Task, ChatNote } from '@/types';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSquads } from '@/contexts/SquadsContext';
import { clients } from '@/data/mockData';
import { priorityConfig, taskTypeConfig } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Send, Clock, User, CalendarDays, Flag, MessageSquare, Trash2 } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const { updateTask, deleteTask } = useTasks();
  const { currentUser } = useAuth();
  const { squads } = useSquads();
  const [newNote, setNewNote] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.chatNotes?.length]);

  if (!task) return null;

  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;
  const chatNotes = task.chatNotes ?? [];
  const priorityConf = priorityConfig[task.priority];
  const typeConf = taskTypeConfig[task.type];

  // Permission check: can delete if leader of client's squad or admin
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{task.responsible}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span>{new Date(task.deadline).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-muted-foreground" />
              <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium border', priorityConf.className)}>
                {priorityConf.icon} {priorityConf.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', typeConf.color)}>
                {typeConf.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>Cliente: {task.clientName}</span>
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

          {/* Chat Notes */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Observações
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chatNotes.length === 0 && (
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
