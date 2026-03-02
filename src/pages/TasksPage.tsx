import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Clock, MessageSquare, AlertTriangle, Trash2, Workflow, ChevronDown, ShoppingBag, X } from 'lucide-react';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSquads } from '@/contexts/SquadsContext';
import { useClients } from '@/contexts/ClientsContext';
import { PageHeader, StatusBadge, Avatar, ProgressBar } from '@/components/ui/shared';
import { priorityConfig } from '@/lib/config';
import { useTaskTypesMap } from '@/hooks/useTaskTypesQuery';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useTaskStatusesQuery, useAddTaskStatus, useDeleteTaskStatus, useUpdateTaskStatus } from '@/hooks/useTaskStatusesQuery';
import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { FlowManagerDialog, FlowDialogMode } from '@/components/FlowManagerDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function TasksPage() {
  const { tasks: allTasks, updateTask, deleteTask } = useTasks();
  const { currentUser } = useAuth();
  const { getVisibleClients, clients } = useClients();
  const { squads } = useSquads();
  const visibleClientIds = new Set(getVisibleClients().map((c) => c.id));
  const tasks = allTasks.filter((t) => visibleClientIds.has(t.clientId));
  const [search, setSearch] = useState('');
  const [responsible, setResponsible] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addToStatus, setAddToStatus] = useState<TaskStatus>('backlog');
  const [flowDialogOpen, setFlowDialogOpen] = useState(false);
  const [flowMode, setFlowMode] = useState<FlowDialogMode>('create');
  const [newColDialogOpen, setNewColDialogOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [deleteColKey, setDeleteColKey] = useState<string | null>(null);

  const { data: taskStatuses = [] } = useTaskStatusesQuery();
  const addStatusMut = useAddTaskStatus();
  const deleteStatusMut = useDeleteTaskStatus();
  const updateStatusMut = useUpdateTaskStatus();

  const cols = taskStatuses.map(s => ({ status: s.key as TaskStatus, label: s.label }));

  const taskTypeMap = useTaskTypesMap();
  const { data: platforms = [] } = usePlatformsQuery();
  const responsibles = ['all', ...Array.from(new Set(tasks.map(t => t.responsible)))];
  const allTypes = ['all', ...Array.from(new Set(tasks.map(t => t.type)))];

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.clientName.toLowerCase().includes(search.toLowerCase());
    const matchResp = responsible === 'all' || t.responsible === responsible;
    const matchType = selectedType === 'all' || t.type === selectedType;
    const matchPlatform = selectedPlatform === 'all' || (t.platforms ?? []).includes(selectedPlatform);
    return matchSearch && matchResp && matchType && matchPlatform;
  });

  const isLate = (task: Task) => new Date(task.deadline) < new Date() && task.status !== 'done';

  const handleDrop = (colStatus: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTask(taskId, { status: colStatus });
    }
  };

  const handleAddCol = () => {
    if (!newColName.trim()) return;
    const key = newColName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    addStatusMut.mutate({ key, label: newColName.trim(), class_name: 'bg-muted text-muted-foreground' });
    setNewColName('');
    setNewColDialogOpen(false);
  };

  const handleDeleteCol = () => {
    if (!deleteColKey) return;
    deleteStatusMut.mutate(deleteColKey);
    setDeleteColKey(null);
  };

  const handleRenameCol = (statusKey: string, newLabel: string) => {
    updateStatusMut.mutate({ key: statusKey, label: newLabel });
    setEditingCol(null);
  };

  const liveSelectedTask = selectedTask ? allTasks.find((t) => t.id === selectedTask.id) ?? null : null;

  return (
    <div className="p-6 animate-fade-in h-full flex flex-col">
      <PageHeader
        title="Demandas"
        subtitle="Gestão de tarefas em Kanban"
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                  <Workflow className="w-4 h-4" />
                  Fluxos
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setFlowMode('create'); setFlowDialogOpen(true); }}>
                  Criar Fluxo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFlowMode('edit'); setFlowDialogOpen(true); }}>
                  Editar Fluxo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setFlowMode('assign'); setFlowDialogOpen(true); }}>
                  Atribuir Fluxo ao Cliente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-medium shadow-primary hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Nova Demanda
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar demanda..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <select
          value={responsible}
          onChange={e => setResponsible(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          {responsibles.map(r => (
            <option key={r} value={r}>{r === 'all' ? 'Todos responsáveis' : r}</option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          {allTypes.map(t => (
            <option key={t} value={t}>
              {t === 'all' ? 'Todos os tipos' : (taskTypeMap[t]?.label ?? t)}
            </option>
          ))}
        </select>
        <select
          value={selectedPlatform}
          onChange={e => setSelectedPlatform(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="all">Todas plataformas</option>
          {platforms.map(p => (
            <option key={p.id} value={p.slug}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {cols.map(col => {
          const colTasks = filtered.filter(t => t.status === col.status);
          return (
            <div
              key={col.status}
              className="flex-shrink-0 w-72"
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(col.status, e)}
            >
              <div className={cn(
                'flex items-center justify-between mb-3 pb-3 border-b-2',
                col.status === 'backlog' ? 'border-b-slate-300' :
                  col.status === 'in_progress' ? 'border-b-info' :
                    col.status === 'waiting_client' ? 'border-b-warning' :
                      col.status === 'done' ? 'border-b-success' : 'border-b-primary/40'
              )}>
                {editingCol === col.status ? (
                  <EditableColInput
                    value={col.label}
                    onSave={(v) => handleRenameCol(col.status, v)}
                    onCancel={() => setEditingCol(null)}
                  />
                ) : (
                  <h3
                    className="text-sm font-semibold text-foreground cursor-text"
                    onClick={() => setEditingCol(col.status)}
                  >
                    {col.label}
                  </h3>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                    {colTasks.length}
                  </span>
                  <button
                    onClick={() => setDeleteColKey(col.status)}
                    className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Excluir coluna"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className={cn(
                'space-y-2.5 min-h-[60px] rounded-xl transition-colors p-1',
                dragOverCol === col.status && 'bg-primary/5 ring-2 ring-primary/20'
              )}>
                {colTasks.map(task => {
                  const canDel = (() => {
                    if (!currentUser) return false;
                    if (currentUser.accessLevel === 3) return true;
                    const client = clients.find((c) => c.id === task.clientId);
                    if (!client) return false;
                    const squad = squads.find((s) => s.id === client.squadId);
                    return squad?.leader === currentUser.name;
                  })();
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isLate={isLate(task)}
                      onClick={() => setSelectedTask(task)}
                      canDelete={canDel}
                      onDelete={() => deleteTask(task.id)}
                    />
                  );
                })}
                <button
                  onClick={() => { setAddToStatus(col.status); setShowAddDialog(true); }}
                  className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>
            </div>
          );
        })}
        <div className="flex-shrink-0 w-72">
          <button
            onClick={() => setNewColDialogOpen(true)}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Coluna
          </button>
        </div>
      </div>

      {/* New Column Dialog */}
      <Dialog open={newColDialogOpen} onOpenChange={setNewColDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Coluna</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddCol(); }}
            placeholder="Nome da coluna"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <DialogFooter>
            <button onClick={() => setNewColDialogOpen(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
            <button onClick={handleAddCol} disabled={!newColName.trim()} className="px-4 py-2 text-sm gradient-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50">Criar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirmation */}
      <AlertDialog open={!!deleteColKey} onOpenChange={(open) => { if (!open) setDeleteColKey(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna?</AlertDialogTitle>
            <AlertDialogDescription>
              As demandas nesta coluna não serão excluídas, mas ficarão sem status visível até serem movidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCol} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskDetailModal
        task={liveSelectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />

      <AddTaskDialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setAddToStatus('backlog'); }} defaultStatus={addToStatus} />
      <FlowManagerDialog open={flowDialogOpen} onOpenChange={setFlowDialogOpen} mode={flowMode} />
    </div>
  );
}

function TaskCard({ task, isLate, onClick, canDelete, onDelete }: { task: Task; isLate: boolean; onClick: () => void; canDelete: boolean; onDelete: () => void }) {
  const taskTypeMap = useTaskTypesMap();
  const typeConf = taskTypeMap[task.type] ?? { label: task.type, color: 'bg-gray-100 text-gray-700' };
  const { data: platforms = [] } = usePlatformsQuery();
  const taskPlatforms = task.platforms ?? [];
  const platformNames = taskPlatforms.map(slug => platforms.find(p => p.slug === slug)?.name ?? slug);
  const priorityConf = priorityConfig[task.priority] ?? { label: task.priority, className: '', icon: '●' };
  const subtasks = task.subtasks ?? [];
  const progress = subtasks.length > 0 ? Math.round((subtasks.filter(s => s.done).length / subtasks.length) * 100) : -1;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        'bg-card rounded-xl border p-3.5 shadow-sm-custom hover:shadow-md-custom transition-all cursor-grab active:cursor-grabbing',
        isLate ? 'border-destructive/30 bg-destructive/5' : 'border-border hover:-translate-y-0.5'
      )}
    >
      {isLate && (
        <div className="flex items-center gap-1.5 text-xs text-destructive font-medium mb-2">
          <AlertTriangle className="w-3 h-3" />
          Atrasada
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug flex-1">{task.title}</p>
        <span className="text-xs">{priorityConf.icon}</span>
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', typeConf.color)}>
          {typeConf.label}
        </span>
        {platformNames.map((name, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-1.5 py-0.5 font-medium">
            <ShoppingBag className="w-3 h-3" />
            {name}
          </span>
        ))}
        <span className="text-xs text-muted-foreground truncate">{task.clientName}</span>
      </div>

      {progress >= 0 && (
        <div className="mb-3">
          <ProgressBar value={progress} className="mb-1" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Subtarefas</span>
            <span className="font-medium">{progress}%</span>
          </div>
        </div>
      )}

      {task.comments && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-3">
          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{task.comments}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {task.estimatedTime}h est.
          {task.realTime && <span className="text-foreground font-medium"> · {task.realTime}h real</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Excluir demanda"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
          <Avatar name={task.responsible} size="sm" />
        </div>
      </div>
    </div>
  );
}

function EditableColInput({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave(text.trim() || value);
    else if (e.key === 'Escape') onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave(text.trim() || value)}
      onKeyDown={handleKeyDown}
      className="text-sm font-medium bg-background border border-primary/30 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 w-32"
    />
  );
}
