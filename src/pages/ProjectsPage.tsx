import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Calendar, ChevronDown, CheckCircle2, Circle, ArrowLeft, Users2, X, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { useProjectsQuery } from '@/hooks/useProjectsQuery';
import { PageHeader, StatusBadge, Avatar, ProgressBar } from '@/components/ui/shared';
import { projectStatusConfig, priorityConfig, projectTypeConfig } from '@/lib/config';
import { Project, ProjectStatus, Squad, Client, ClientStatus, TaskStatus } from '@/types';
import { ProjectSummaryPanel } from '@/components/ProjectSummaryPanel';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSquads } from '@/contexts/SquadsContext';
import { useClients } from '@/contexts/ClientsContext';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useClientStatusesQuery, useClientStatusesMap, useAddClientStatus, useDeleteClientStatus, useUpdateClientStatus } from '@/hooks/useClientStatusesQuery';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

type KanbanColumn = { id: string; label: string; status: ClientStatus | string };
type ProjectKanbanColumn = { id: string; label: string; status: ProjectStatus | string };

const statusCols: {status: ProjectStatus;label: string;}[] = [
{ status: 'backlog', label: 'Backlog' },
{ status: 'in_progress', label: 'Em Andamento' },
{ status: 'waiting_client', label: 'Aguard. Cliente' },
{ status: 'done', label: 'Concluído' }];


export function ProjectsPage() {
  const { currentUser } = useAuth();
  const { squads, addSquad, removeSquad, updateSquad } = useSquads();
  const { addTask } = useTasks();
  const { data: projects = [] } = useProjectsQuery();
  const { updateClientField, getVisibleClients } = useClients();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: clientStatuses = [] } = useClientStatusesQuery();
  const clientStatusMap = useClientStatusesMap();
  const addStatusMut = useAddClientStatus();
  const deleteStatusMut = useDeleteClientStatus();
  const updateStatusMut = useUpdateClientStatus();
  const clients = getVisibleClients();
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [addDemandOpen, setAddDemandOpen] = useState(false);
  const [addColDialogOpen, setAddColDialogOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [deleteColConfirm, setDeleteColConfirm] = useState<{ id: string; label: string; status: string } | null>(null);

  // Squad management state
  const [squadDialogOpen, setSquadDialogOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);
  const [squadName, setSquadName] = useState('');
  const [squadLeader, setSquadLeader] = useState('');
  const [squadMemberNames, setSquadMemberNames] = useState<string[]>([]);

  const openAddSquad = () => {
    setEditingSquad(null);
    setSquadName('');
    setSquadLeader('');
    setSquadMemberNames([]);
    setSquadDialogOpen(true);
  };

  const openEditSquad = (squad: Squad, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSquad(squad);
    setSquadName(squad.name);
    setSquadLeader(squad.leader);
    setSquadMemberNames(squad.members.filter((m) => m !== squad.leader));
    setSquadDialogOpen(true);
  };

  const handleDeleteSquad = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSquad(id);
  };

  const toggleMember = (name: string) => {
    setSquadMemberNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSaveSquad = () => {
    if (!squadName.trim() || !squadLeader.trim()) return;
    const members = [squadLeader.trim(), ...squadMemberNames.filter((m) => m !== squadLeader.trim())];
    if (editingSquad) {
      updateSquad(editingSquad.id, { name: squadName.trim(), leader: squadLeader.trim(), members });
      if (selectedSquad?.id === editingSquad.id) {
        setSelectedSquad({ ...editingSquad, name: squadName.trim(), leader: squadLeader.trim(), members });
      }
    } else {
      addSquad({ id: crypto.randomUUID(), name: squadName.trim(), leader: squadLeader.trim(), members });
    }
    setSquadDialogOpen(false);
  };
  const [clientCols, setClientCols] = useState<KanbanColumn[]>([
    { id: 'onboarding', label: 'Onboarding', status: 'onboarding' },
    { id: 'active', label: 'Ativo', status: 'active' },
    { id: 'paused', label: 'Pausado', status: 'paused' },
    { id: 'churned', label: 'Churned', status: 'churned' },
  ]);

  // Sync kanban columns when dynamic statuses load
  useEffect(() => {
    if (clientStatuses.length > 0) {
      setClientCols(clientStatuses.map(s => ({ id: s.key, label: s.label, status: s.key })));
    }
  }, [clientStatuses]);
  const [dragOverClientCol, setDragOverClientCol] = useState<string | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);

  const isAdmin = currentUser?.accessLevel === 3;
  const visibleSquads = isAdmin ? squads : squads.filter((s) => currentUser?.squadIds.includes(s.id));

  // Step 1: Show squads
  if (!selectedSquad) {
    return (
      <div className="p-6 animate-fade-in">
        <PageHeader
          title="Squads"
          subtitle="Selecione um squad para ver os clientes e projetos"
          actions={
            isAdmin ? (
              <Button onClick={openAddSquad} className="gradient-primary shadow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Squad
              </Button>
            ) : undefined
          }
        />
        <div className="grid grid-cols-3 gap-4">
          {visibleSquads.map((squad) => {
            const squadClients = clients.filter((c) => c.squadId === squad.id);
            const squadProjects = projects.filter((p) => squadClients.some((c) => c.id === p.clientId));
            const activeProjects = squadProjects.filter((p) => p.status === 'in_progress').length;
            return (
              <div
                key={squad.id}
                className="bg-card rounded-xl border border-border p-6 shadow-sm-custom hover:shadow-md-custom hover:-translate-y-0.5 transition-all text-left group cursor-pointer relative"
              >
                {/* Action buttons — admin only */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => openEditSquad(squad, e)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Editar squad"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSquad(squad.id, e)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Apagar squad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div onClick={() => setSelectedSquad(squad)} className="h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center">
                      <Users2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{squad.name}</h3>
                      <p className="text-xs text-muted-foreground">Líder: {squad.leader}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-medium">{squadClients.length} clientes</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">{activeProjects} ativos</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {squad.members.map((m) =>
                      <Avatar key={m} name={m} size="sm" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Squad Add/Edit Dialog */}
        <Dialog open={squadDialogOpen} onOpenChange={setSquadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSquad ? 'Editar Squad' : 'Novo Squad'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Squad</Label>
                <Input value={squadName} onChange={(e) => setSquadName(e.target.value)} placeholder="Ex: Squad Alpha" />
              </div>
              <div className="space-y-2">
                <Label>Líder</Label>
                <Select value={squadLeader} onValueChange={setSquadLeader}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o líder" />
                  </SelectTrigger>
                  <SelectContent>
                    {appUsers.map((u) => (
                      <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Membros</Label>
                <div className="flex flex-wrap gap-2">
                  {appUsers
                    .filter((u) => u.name !== squadLeader)
                    .map((u) => {
                      const selected = squadMemberNames.includes(u.name);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleMember(u.name)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                          )}
                        >
                          {u.name}
                        </button>
                      );
                    })}
                  {appUsers.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum colaborador cadastrado. Adicione em Configurações.</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSquadDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveSquad} className="gradient-primary shadow-primary">
                {editingSquad ? 'Salvar' : 'Criar Squad'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Step 2: Show clients of selected squad (Kanban by status)
  if (!selectedClient) {
    const squadClients = clients.filter((c) => c.squadId === selectedSquad.id);

    const handleRenameCol = (id: string, newLabel: string) => {
      const col = clientCols.find(c => c.id === id);
      if (col) {
        updateStatusMut.mutate({ key: col.status as string, label: newLabel });
      }
      setEditingColId(null);
    };

    const handleRemoveCol = (id: string) => {
      const col = clientCols.find(c => c.id === id);
      if (col) {
        setDeleteColConfirm({ id: col.id, label: col.label, status: col.status as string });
      }
    };

    const confirmRemoveCol = () => {
      if (deleteColConfirm) {
        deleteStatusMut.mutate(deleteColConfirm.status);
        setDeleteColConfirm(null);
      }
    };

    const handleAddCol = () => {
      setNewColLabel('');
      setAddColDialogOpen(true);
    };

    const confirmAddCol = () => {
      const label = newColLabel.trim();
      if (!label) return;
      const key = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      addStatusMut.mutate({ key, label, class_name: 'bg-muted text-muted-foreground border-border' });
      setAddColDialogOpen(false);
    };

    return (
      <div className="p-6 animate-fade-in h-full flex flex-col">
        <PageHeader
          title={selectedSquad.name}
          subtitle={`${squadClients.length} clientes neste squad`}
          actions={
          <button
            onClick={() => setSelectedSquad(null)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar aos Squads
            </button>
          } />

        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {clientCols.map((col) => {
            const colClients = squadClients.filter((c) => c.status === col.status);
            const conf = clientStatusMap[col.status as string];
            return (
              <div
                key={col.id}
                className="flex-shrink-0 w-72 group/col"
                onDragOver={(e) => { e.preventDefault(); setDragOverClientCol(col.id); }}
                onDragLeave={() => setDragOverClientCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverClientCol(null);
                  const clientId = e.dataTransfer.getData('text/plain');
                  if (clientId) {
                    updateClientField(clientId, 'status', col.status, 'Status');
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  {editingColId === col.id ? (
                    <EditableColInput
                      value={col.label}
                      onSave={(v) => handleRenameCol(col.id, v)}
                      onCancel={() => setEditingColId(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingColId(col.id)}
                      className="cursor-text"
                    >
                      <StatusBadge className={conf?.className ?? 'bg-muted text-muted-foreground border-border'}>
                        {col.label}
                      </StatusBadge>
                    </button>
                  )}
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                    {colClients.length}
                  </span>
                  <button
                    onClick={() => handleRemoveCol(col.id)}
                    className="ml-auto opacity-0 group-hover/col:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Remover coluna"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className={cn(
                  'space-y-3 min-h-[60px] rounded-xl transition-colors p-1',
                  dragOverClientCol === col.id && 'bg-primary/5 ring-2 ring-primary/20'
                )}>
                  {colClients.map((client) => {
                    const clientProjects = projects.filter((p) => p.clientId === client.id);
                    const activeCount = clientProjects.filter((p) => p.status === 'in_progress').length;
                    return (
                      <div
                        key={client.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', client.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => setSelectedClient(client)}
                        className="w-full bg-card rounded-xl border border-border p-4 shadow-sm-custom hover:shadow-md-custom hover:-translate-y-0.5 transition-all text-left group cursor-grab active:cursor-grabbing">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                          {client.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">{client.segment}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{clientProjects.length} projetos</span>
                          <span>•</span>
                          <span className="text-primary font-medium">{activeCount} ativos</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Add new column button */}
          <div className="flex-shrink-0 w-72">
            <button
              onClick={handleAddCol}
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Coluna
            </button>
          </div>
        </div>

        {/* Add Column Dialog */}
        <Dialog open={addColDialogOpen} onOpenChange={setAddColDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nova Coluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Nome da coluna</Label>
              <Input
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                placeholder="Ex: Em Revisão"
                onKeyDown={(e) => e.key === 'Enter' && confirmAddCol()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddColDialogOpen(false)}>Cancelar</Button>
              <Button onClick={confirmAddCol} disabled={!newColLabel.trim() || addStatusMut.isPending}>
                {addStatusMut.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Column Confirmation */}
        <AlertDialog open={!!deleteColConfirm} onOpenChange={(open) => !open && setDeleteColConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir coluna "{deleteColConfirm?.label}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Os clientes nesta coluna não serão excluídos, mas ficarão sem status definido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveCol} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Step 3: Show projects of selected client
  const filtered = projects.
  filter((p) => p.clientId === selectedClient.id).
  filter((p) =>
  p.name.toLowerCase().includes(search.toLowerCase()) ||
  p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 animate-fade-in h-full flex flex-col">
      <PageHeader
        title={`Projetos — ${selectedClient.name}`}
        subtitle={`${filtered.filter((p) => p.status === 'in_progress').length} projetos em andamento`}
        actions={
        <>
            <button
            onClick={() => setSelectedClient(null)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">

              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex bg-card border border-border rounded-lg p-0.5">
              {(['kanban', 'list'] as const).map((v) =>
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}>

                  {v === 'kanban' ? 'Kanban' : 'Lista'}
                </button>
            )}
            </div>
            <button
              onClick={() => setAddDemandOpen(true)}
              className="flex items-center gap-2 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-medium shadow-primary hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Adicionar Demanda
            </button>
          </>
        } />

      <AddTaskDialog
        open={addDemandOpen}
        onOpenChange={setAddDemandOpen}
        defaultStatus="backlog"
      />


      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative mb-5 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar projeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
          </div>

          {view === 'kanban' ?
          <KanbanView filtered={filtered} clientId={selectedClient.id} clientName={selectedClient.name} squadMembers={selectedSquad.members} /> :
          <ListView filtered={filtered} />
          }
        </div>

        <ProjectSummaryPanel projects={filtered} />
      </div>
    </div>);

}

function KanbanView({ filtered, clientId, clientName, squadMembers }: {filtered: Project[]; clientId: string; clientName: string; squadMembers: string[];}) {
  const { tasks: allTasks, addTask, updateTask, deleteTask } = useTasks();
  const { currentUser } = useAuth();
  const { squads } = useSquads();
  const { getVisibleClients } = useClients();
  const clients = getVisibleClients();
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const allProjects = [...filtered, ...localProjects];
  const [cols, setCols] = useState<ProjectKanbanColumn[]>([
    { id: 'backlog', label: 'Backlog', status: 'backlog' },
    { id: 'in_progress', label: 'Em Andamento', status: 'in_progress' },
    { id: 'waiting_client', label: 'Aguard. Cliente', status: 'waiting_client' },
    { id: 'done', label: 'Concluído', status: 'done' },
  ]);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [demandDialog, setDemandDialog] = useState<{ open: boolean; status: TaskStatus }>({ open: false, status: 'backlog' });
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const liveSelectedTask = selectedTask ? allTasks.find((t) => t.id === selectedTask) ?? null : null;

  const handleAddDemand = (task: any) => {
    addTask(task);
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      clientId,
      clientName,
      name: task.title,
      type: 'criacao_anuncio',
      responsible: task.responsible,
      startDate: task.createdAt,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status as ProjectStatus,
      checklist: [],
      progress: 0,
    };
    setLocalProjects((prev) => [...prev, newProject]);
  };

  const handleRenameCol = (id: string, newLabel: string) => {
    setCols((c) => c.map((col) => (col.id === id ? { ...col, label: newLabel } : col)));
    setEditingColId(null);
  };

  const handleRemoveCol = (id: string) => {
    setCols((c) => c.filter((col) => col.id !== id));
  };

  const handleAddCol = () => {
    const newId = `proj_custom_${Date.now()}`;
    setCols((c) => [...c, { id: newId, label: 'Nova Coluna', status: newId }]);
    setEditingColId(newId);
  };

  const handleDrop = (colStatus: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTask(taskId, { status: colStatus as TaskStatus });
      // Also update local projects
      setLocalProjects((prev) => prev.map((p) => {
        // Find corresponding task
        const task = allTasks.find((t) => t.id === taskId);
        if (task && p.name === task.title) {
          return { ...p, status: colStatus as ProjectStatus };
        }
        return p;
      }));
    }
  };

  // Build task-backed project cards
  const getColTasks = (colStatus: string) => {
    return allTasks.filter((t) => t.clientId === clientId && t.status === colStatus);
  };

  return (
    <>
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {cols.map((col) => {
          const colProjects = allProjects.filter((p) => p.status === col.status);
          const colTasks = getColTasks(col.status);
          const conf = projectStatusConfig[col.status as ProjectStatus];
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 group/col"
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(col.status, e)}
            >
              <div className="flex items-center gap-2 mb-3">
                {conf && <div className={cn('w-2 h-2 rounded-full', conf.dot)} />}
                {editingColId === col.id ? (
                  <EditableColInput
                    value={col.label}
                    onSave={(v) => handleRenameCol(col.id, v)}
                    onCancel={() => setEditingColId(null)}
                  />
                ) : (
                  <button onClick={() => setEditingColId(col.id)} className="cursor-text">
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  </button>
                )}
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                  {colTasks.length}
                </span>
                <button
                  onClick={() => handleRemoveCol(col.id)}
                  className="ml-auto opacity-0 group-hover/col:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Remover coluna"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={cn(
                'space-y-3 min-h-[60px] rounded-xl transition-colors p-1',
                dragOverCol === col.id && 'bg-primary/5 ring-2 ring-primary/20'
              )}>
                {colTasks.map((task) => {
                  const canDel = (() => {
                    if (!currentUser) return false;
                    if (currentUser.accessLevel === 3) return true;
                    const client = clients.find((c) => c.id === task.clientId);
                    if (!client) return false;
                    const sq = squads.find((s) => s.id === client.squadId);
                    return sq?.leader === currentUser.name;
                  })();
                  return (
                    <DemandCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task.id)}
                      canDelete={canDel}
                      onDelete={() => deleteTask(task.id)}
                    />
                  );
                })}
                {colProjects.filter(p => !colTasks.some(t => t.title === p.name)).map((project) =>
                  <ProjectCard key={project.id} project={project} />
                )}
                <button
                  onClick={() => setDemandDialog({ open: true, status: (col.status as TaskStatus) || 'backlog' })}
                  className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar demanda
                </button>
              </div>
            </div>);
        })}
        <div className="flex-shrink-0 w-72">
          <button
            onClick={handleAddCol}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Coluna
          </button>
        </div>
      </div>

      <AddTaskDialog
        open={demandDialog.open}
        onOpenChange={(open) => setDemandDialog((prev) => ({ ...prev, open }))}
        defaultStatus={demandDialog.status}
      />

      <TaskDetailModal
        task={liveSelectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />
    </>
  );
}

function DemandCard({ task, onClick, canDelete, onDelete }: { task: import('@/types').Task; onClick: () => void; canDelete: boolean; onDelete: () => void }) {
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
      className="bg-card rounded-xl border border-border p-4 shadow-sm-custom hover:shadow-md-custom transition-all cursor-grab active:cursor-grabbing"
    >
      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-2">{task.title}</p>
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={task.responsible} size="sm" />
        <span className="text-xs text-muted-foreground truncate">{task.responsible}</span>
      </div>
      {progress >= 0 && (
        <div className="mb-2">
          <ProgressBar value={progress} className="mb-1" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Subtarefas</span>
            <span className="font-medium">{progress}%</span>
          </div>
        </div>
      )}
      {task.comments && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-2">
          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{task.comments}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(task.deadline).toLocaleDateString('pt-BR')}
        </div>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Excluir demanda"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ListView({ filtered }: {filtered: Project[];}) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm-custom">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {['Projeto', 'Cliente', 'Responsável', 'Prazo', 'Prioridade', 'Status', 'Progresso'].map((h) =>
            <th key={h} className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">{h}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.map((project) => {
            const statusConf = projectStatusConfig[project.status];
            const priorityConf = priorityConfig[project.priority];
            return (
              <tr key={project.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                <td className="py-3 px-4">
                  <p className="text-sm font-medium text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{projectTypeConfig[project.type].label}</p>
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{project.clientName}</td>
                <td className="py-3 px-4"><Avatar name={project.responsible} size="sm" /></td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {new Date(project.deadline).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge className={priorityConf.className}>
                    {priorityConf.icon} {priorityConf.label}
                  </StatusBadge>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge className={statusConf.className}>{statusConf.label}</StatusBadge>
                </td>
                <td className="py-3 px-4 w-32">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={project.progress} className="flex-1" />
                    <span className="text-xs font-medium text-muted-foreground">{project.progress}%</span>
                  </div>
                </td>
              </tr>);

          })}
        </tbody>
      </table>
    </div>);

}

function ProjectCard({ project }: {project: Project;}) {
  const [expanded, setExpanded] = useState(false);
  const priorityConf = priorityConfig[project.priority];
  const doneItems = project.checklist.filter((c) => c.done).length;

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm-custom hover:shadow-md-custom transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{project.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{project.clientName}</p>
        </div>
        <StatusBadge className={priorityConf.className}>{priorityConf.icon}</StatusBadge>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Avatar name={project.responsible} size="sm" />
        <span className="text-xs text-muted-foreground truncate">{project.responsible}</span>
      </div>

      <ProgressBar value={project.progress} className="mb-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>Progresso</span>
        <span className="font-medium">{project.progress}%</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {new Date(project.deadline).toLocaleDateString('pt-BR')}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">

          <CheckCircle2 className="w-3 h-3" />
          {doneItems}/{project.checklist.length}
          <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded &&
      <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {project.checklist.map((item) =>
        <div key={item.id} className="flex items-center gap-2">
              {item.done ?
          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> :
          <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          }
              <span className={cn('text-xs', item.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                {item.label}
              </span>
            </div>
        )}
        </div>
      }
    </div>);

}

function EditableColInput({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(text.trim() || value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
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