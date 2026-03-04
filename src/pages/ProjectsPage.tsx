import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Calendar, CalendarDays, ChevronDown, CheckCircle2, Circle, ArrowLeft, Users2, X, Pencil, Trash2, MessageSquare, ShoppingBag, LayoutGrid, Zap, ArrowRightLeft, Workflow, CreditCard, Building2, User, Phone, Mail, FileText, UserCircle, Briefcase, ListChecks } from 'lucide-react';
import { mockAnalysisData } from '@/components/ClientAIAnalysis';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
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
import { useClientStatusesQuery, useClientStatusesMap, useAddClientStatus, useDeleteClientStatus, useUpdateClientStatus, useReorderClientStatuses } from '@/hooks/useClientStatusesQuery';
import { usePlatformPhaseStatusesQuery, useAddPlatformPhaseStatus, useDeletePlatformPhaseStatus, useUpdatePlatformPhaseStatus, useReorderPlatformPhaseStatuses } from '@/hooks/usePlatformPhaseStatusesQuery';
import { useUpdateClientPlatform, useAddClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { getPlatformAttributeSummary, PLATFORM_ATTRIBUTE_DEFINITIONS } from '@/components/PlatformAttributesEditor';
import { format } from 'date-fns';
import { GenerateDemandsDialog } from '@/components/GenerateDemandsDialog';
import { TransferPlatformDialog } from '@/components/TransferPlatformDialog';
import { FlowManagerDialog, FlowDialogMode } from '@/components/FlowManagerDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const { tasks: allTasksData, addTask } = useTasks();
  const { data: projects = [] } = useProjectsQuery();
  const { updateClientField, getVisibleClients } = useClients();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: clientStatuses = [] } = useClientStatusesQuery();
  const clientStatusMap = useClientStatusesMap();
  const addStatusMut = useAddClientStatus();
  const deleteStatusMut = useDeleteClientStatus();
  const updateStatusMut = useUpdateClientStatus();
  const clients = getVisibleClients();
  const { data: platformOptions = [] } = usePlatformsQuery();
  const { data: clientPlatformsData = [] } = useClientPlatformsQuery();
  const updatePlatformMut = useUpdateClientPlatform();
  const addClientPlatformMut = useAddClientPlatform();
  const [addPlatformDialogOpen, setAddPlatformDialogOpen] = useState(false);
  const [newPlatformSlug, setNewPlatformSlug] = useState('');
  const { data: platformPhaseStatuses = [] } = usePlatformPhaseStatusesQuery();
  const addPlatPhaseMut = useAddPlatformPhaseStatus();
  const deletePlatPhaseMut = useDeletePlatformPhaseStatus();
  const updatePlatPhaseMut = useUpdatePlatformPhaseStatus();
  const reorderPlatPhaseMut = useReorderPlatformPhaseStatuses();
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [addDemandOpen, setAddDemandOpen] = useState(false);
  const [addColDialogOpen, setAddColDialogOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [deleteColConfirm, setDeleteColConfirm] = useState<{ id: string; label: string; status: string } | null>(null);

  // Generate demands & transfer platform state
  const [generateTarget, setGenerateTarget] = useState<{ phase: string; clientId: string; clientName: string; platformSlug: string; squadId: string | null } | null>(null);
  const [transferTarget, setTransferTarget] = useState<{ platformId: string; squadId: string | null; responsible: string } | null>(null);
  const [flowDialogOpen, setFlowDialogOpen] = useState(false);

  // Platform kanban editing state
  const [platAddColOpen, setPlatAddColOpen] = useState(false);
  const [platNewColLabel, setPlatNewColLabel] = useState('');
  const [platDeleteColConfirm, setPlatDeleteColConfirm] = useState<{ key: string; label: string } | null>(null);
  const [platEditingColKey, setPlatEditingColKey] = useState<string | null>(null);
  const [platDragOverCol, setPlatDragOverCol] = useState<string | null>(null);
  const [draggingPlatColKey, setDraggingPlatColKey] = useState<string | null>(null);
  const [platColDropTarget, setPlatColDropTarget] = useState<string | null>(null);
  const [draggingPlatCardSlug, setDraggingPlatCardSlug] = useState<string | null>(null);
  const [flowMode, setFlowMode] = useState<FlowDialogMode>('create');

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
  const reorderClientMut = useReorderClientStatuses();
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
  const [draggingClientColId, setDraggingClientColId] = useState<string | null>(null);
  const [clientColDropTarget, setClientColDropTarget] = useState<string | null>(null);

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
            const activeStatusKeys = clientStatuses
              .filter(s => s.label.toLowerCase().includes('ativo') || s.key === 'active')
              .map(s => s.key);
            const activeClients = squadClients.filter(c => activeStatusKeys.includes(c.status)).length;
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
                    <span className="text-primary font-semibold">{activeClients} ativos</span>
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

    const handleClientColDragStart = (e: React.DragEvent, colId: string) => {
      e.dataTransfer.setData('column-key', colId);
      e.dataTransfer.effectAllowed = 'move';
      setDraggingClientColId(colId);
    };

    const handleClientColDragOver = (e: React.DragEvent, colId: string) => {
      e.preventDefault();
      if (draggingClientColId && draggingClientColId !== colId) {
        setClientColDropTarget(colId);
      }
    };

    const handleClientColDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('column-key');
      if (!sourceId || sourceId === targetId) {
        setDraggingClientColId(null);
        setClientColDropTarget(null);
        return;
      }
      const currentIds = clientCols.map(c => c.id);
      const sourceIdx = currentIds.indexOf(sourceId);
      const targetIdx = currentIds.indexOf(targetId);
      if (sourceIdx === -1 || targetIdx === -1) return;
      const newIds = [...currentIds];
      newIds.splice(sourceIdx, 1);
      newIds.splice(targetIdx, 0, sourceId);
      const reorderItems = newIds.map((id, i) => ({ key: id, sort_order: i }));
      reorderClientMut.mutate(reorderItems);
      setDraggingClientColId(null);
      setClientColDropTarget(null);
    };

    const handleClientColDragEnd = () => {
      setDraggingClientColId(null);
      setClientColDropTarget(null);
    };

    const phaseLabels: Record<string, string> = {
      onboarding: 'Onboarding',
      implementacao: 'Implementação',
      escala: 'Escala',
      performance: 'Performance',
      active: 'Ativo',
      inativo: 'Inativo',
    };

    const filteredSquadClients = squadClients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.segment.toLowerCase().includes(search.toLowerCase())
    );

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

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome ou segmento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-sm"
          />
        </div>

        <div className="flex gap-4 h-[calc(100vh-190px)] overflow-x-auto pb-4">
          {clientCols.map((col) => {
            const colClients = filteredSquadClients.filter((c) => c.status === col.status);
            const conf = clientStatusMap[col.status as string];
            return (
              <div
                key={col.id}
                className={cn(
                  'flex-shrink-0 w-80 group/col relative flex flex-col h-full',
                  draggingClientColId === col.id && 'opacity-50'
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingClientColId) {
                    handleClientColDragOver(e, col.id);
                  } else {
                    setDragOverClientCol(col.id);
                  }
                }}
                onDragLeave={() => { setDragOverClientCol(null); setClientColDropTarget(null); }}
                onDrop={(e) => {
                  if (draggingClientColId) {
                    handleClientColDrop(e, col.id);
                  } else {
                    e.preventDefault();
                    setDragOverClientCol(null);
                    const clientId = e.dataTransfer.getData('text/plain');
                    if (clientId) {
                      updateClientField(clientId, 'status', col.status, 'Status');
                    }
                  }
                }}
              >
                {/* Column drop indicator */}
                {clientColDropTarget === col.id && draggingClientColId && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full z-10" />
                )}
                <div
                  draggable
                  onDragStart={(e) => handleClientColDragStart(e, col.id)}
                  onDragEnd={handleClientColDragEnd}
                  className="flex items-center gap-2 mb-3 cursor-grab active:cursor-grabbing"
                >
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
                  'space-y-3 min-h-0 rounded-xl transition-colors p-1 flex-1 overflow-y-auto',
                  dragOverClientCol === col.id && 'bg-primary/5 ring-2 ring-primary/20'
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!draggingClientColId) {
                    setDragOverClientCol(col.id);
                  }
                }}
                onDrop={(e) => {
                  if (!draggingClientColId) {
                    e.preventDefault();
                    setDragOverClientCol(null);
                    const clientId = e.dataTransfer.getData('text/plain');
                    if (clientId) {
                      updateClientField(clientId, 'status', col.status, 'Status');
                    }
                  }
                }}>
                  {colClients.map((client) => {
                    const clientProjects = projects.filter((p) => p.clientId === client.id);
                    const activeCount = clientProjects.filter((p) => p.status === 'in_progress').length;
                    const statusConf = clientStatusMap[client.status] ?? { label: client.status, className: 'bg-muted text-muted-foreground border-border' };
                    const squad = squads.find((s) => s.id === client.squadId);
                    const pendingTasks = allTasksData.filter((t) => t.clientId === client.id && t.status !== 'done').length;
                    const analysis = mockAnalysisData[client.id];
                    const nps = analysis?.satisfactionScore;
                    return (
                      <div
                        key={client.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', client.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => { setSelectedPlatform(null); setSelectedClient(client); }}
                        className="w-full bg-card rounded-xl border border-border p-5 shadow-sm-custom hover:shadow-md-custom hover:-translate-y-0.5 transition-all text-left group cursor-grab active:cursor-grabbing">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {client.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">{client.segment}</p>
                            </div>
                          </div>
                          <StatusBadge className={statusConf.className}>{statusConf.label}</StatusBadge>
                        </div>

                        {/* Context line: Platforms + Health */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          {client.platforms && client.platforms.length > 0 && client.platforms.map((slug) => {
                            const plat = platformOptions.find((p) => p.slug === slug);
                            return (
                              <span key={slug} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
                                <ShoppingBag className="w-3 h-3 shrink-0" />
                                {plat?.name ?? slug}
                              </span>
                            );
                          })}
                          <div
                            className={cn(
                              'w-3.5 h-3.5 rounded-full border border-border shrink-0 ml-auto',
                              { green: 'bg-success', yellow: 'bg-warning', red: 'bg-destructive', white: 'bg-border' }[client.healthColor ?? 'white']
                            )}
                            title={`Saúde: ${client.healthColor ?? 'não avaliado'}`}
                          />
                        </div>

                        {/* Metadata line */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {client.responsible && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
                              <User className="w-3 h-3 shrink-0" />
                              {client.responsible}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {new Date(client.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {/* Metrics grid */}
                        <div className="pt-3 border-t border-border">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <p className="text-sm font-bold text-foreground">{pendingTasks}</p>
                              <p className="text-xs text-muted-foreground">Pendentes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-foreground">
                                {client.monthlyRevenue ? `R$${(client.monthlyRevenue / 1000).toFixed(1)}k` : '—'}
                              </p>
                              <p className="text-xs text-muted-foreground">Mensalidade</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-foreground">
                                {client.contractDurationMonths ? `${client.contractDurationMonths}m` : '—'}
                              </p>
                              <p className="text-xs text-muted-foreground">Contrato</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Add new column button */}
          <div className="flex-shrink-0 w-80">
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

  // Step 2.5: Platform selection for this client
  if (selectedPlatform === null && selectedClient.platforms && selectedClient.platforms.length > 0) {
    const clientTasks = allTasksData.filter(t => t.clientId === selectedClient.id);
    const clientProjects = projects.filter(p => p.clientId === selectedClient.id);

    return (
    <>
      <div className="p-6 animate-fade-in">
        <PageHeader
          title={selectedClient.name}
          subtitle="Selecione uma plataforma para ver os projetos"
          actions={
            <button
              onClick={() => setSelectedClient(null)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          }
        />
        {/* Ver Todos button + Adicionar Plataforma */}
        <div className="flex items-center gap-3 mt-2 mb-4">
          <div
            onClick={() => setSelectedPlatform('all')}
            className="bg-card rounded-xl border border-border p-5 shadow-sm-custom hover:shadow-md-custom hover:-translate-y-0.5 transition-all cursor-pointer group inline-flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Todas</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{clientProjects.length} projetos</span>
                <span>•</span>
                <span>{clientTasks.length} demandas</span>
              </div>
            </div>
          </div>
          {(() => {
            const currentSlugs = selectedClient.platforms ?? [];
            const available = platformOptions.filter(p => !currentSlugs.includes(p.slug));
            return available.length > 0 ? (
              <Button variant="outline" onClick={() => { setNewPlatformSlug(''); setAddPlatformDialogOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Plataforma
              </Button>
            ) : null;
          })()}
        </div>

        {/* Kanban by phase — editable */}
        {(() => {
          const platformsByPhase: Record<string, string[]> = {};
          for (const slug of selectedClient.platforms!) {
            const cp = clientPlatformsData.find(c => c.clientId === selectedClient.id && c.platformSlug === slug);
            const phase = cp?.phase ?? 'onboarding';
            if (!platformsByPhase[phase]) platformsByPhase[phase] = [];
            platformsByPhase[phase].push(slug);
          }

          const columns = platformPhaseStatuses.length > 0
            ? platformPhaseStatuses
            : [{ key: 'onboarding', label: 'Onboarding' }, { key: 'implementacao', label: 'Implementação' }, { key: 'escala', label: 'Escala' }, { key: 'performance', label: 'Performance' }];

          const handlePlatColDragStart = (e: React.DragEvent, key: string) => {
            e.dataTransfer.setData('plat-column-key', key);
            e.dataTransfer.effectAllowed = 'move';
            setDraggingPlatColKey(key);
          };
          const handlePlatColDragEnd = () => { setDraggingPlatColKey(null); setPlatColDropTarget(null); };
          const handlePlatColDrop = (e: React.DragEvent, targetKey: string) => {
            e.preventDefault();
            const sourceKey = e.dataTransfer.getData('plat-column-key');
            if (!sourceKey || sourceKey === targetKey) { handlePlatColDragEnd(); return; }
            const keys = columns.map(c => c.key);
            const si = keys.indexOf(sourceKey);
            const ti = keys.indexOf(targetKey);
            if (si === -1 || ti === -1) return;
            const newKeys = [...keys];
            newKeys.splice(si, 1);
            newKeys.splice(ti, 0, sourceKey);
            reorderPlatPhaseMut.mutate(newKeys.map((k, i) => ({ key: k, sort_order: i })));
            handlePlatColDragEnd();
          };

          const handlePlatCardDrop = (e: React.DragEvent, targetPhase: string) => {
            e.preventDefault();
            setPlatDragOverCol(null);
            const slug = e.dataTransfer.getData('plat-card-slug');
            if (!slug) return;
            const cp = clientPlatformsData.find(c => c.clientId === selectedClient.id && c.platformSlug === slug);
            if (cp && cp.phase !== targetPhase) {
              updatePlatformMut.mutate({ id: cp.id, updates: { phase: targetPhase } });
            }
          };

          return (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((col) => {
                const colKey = col.key;
                const colLabel = col.label;
                const slugsInCol = platformsByPhase[colKey] ?? [];

                return (
                  <div
                    key={colKey}
                    className={cn(
                      'min-w-[240px] w-[260px] shrink-0 group/col relative flex flex-col',
                      draggingPlatColKey === colKey && 'opacity-50'
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggingPlatColKey && draggingPlatColKey !== colKey) {
                        setPlatColDropTarget(colKey);
                      } else if (!draggingPlatColKey) {
                        setPlatDragOverCol(colKey);
                      }
                    }}
                    onDragLeave={() => { setPlatDragOverCol(null); setPlatColDropTarget(null); }}
                    onDrop={(e) => {
                      if (draggingPlatColKey) {
                        handlePlatColDrop(e, colKey);
                      } else {
                        handlePlatCardDrop(e, colKey);
                      }
                    }}
                  >
                    {platColDropTarget === colKey && draggingPlatColKey && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full z-10" />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => handlePlatColDragStart(e, colKey)}
                      onDragEnd={handlePlatColDragEnd}
                      className="flex items-center gap-2 mb-3 px-1 cursor-grab active:cursor-grabbing"
                    >
                      {platEditingColKey === colKey ? (
                        <EditableColInput
                          value={colLabel}
                          onSave={(v) => { updatePlatPhaseMut.mutate({ key: colKey, label: v }); setPlatEditingColKey(null); }}
                          onCancel={() => setPlatEditingColKey(null)}
                        />
                      ) : (
                        <button onClick={() => setPlatEditingColKey(colKey)} className="cursor-text">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{colLabel}</span>
                        </button>
                      )}
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{slugsInCol.length}</span>
                      <button
                        onClick={() => setPlatDeleteColConfirm({ key: colKey, label: colLabel })}
                        className="ml-auto opacity-0 group-hover/col:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Remover coluna"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className={cn(
                      'space-y-3 min-h-[80px] bg-muted/30 rounded-lg p-2 flex-1',
                      platDragOverCol === colKey && !draggingPlatColKey && 'bg-primary/5 ring-2 ring-primary/20'
                    )}
                    onDragOver={(e) => { e.preventDefault(); if (!draggingPlatColKey) setPlatDragOverCol(colKey); }}
                    onDrop={(e) => { if (!draggingPlatColKey) handlePlatCardDrop(e, colKey); }}
                    >
                      {slugsInCol.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6 italic">Nenhuma plataforma</p>
                      )}
                      {slugsInCol.map((slug) => {
                        const plat = platformOptions.find(p => p.slug === slug);
                        const platTasks = clientTasks.filter(t => t.platforms?.includes(slug));
                        const platProjectIds = new Set(platTasks.map(t => t.projectId).filter(Boolean));
                        const platProjects = clientProjects.filter(p => platProjectIds.has(p.id));
                        const cp = clientPlatformsData.find(c => c.clientId === selectedClient.id && c.platformSlug === slug);
                        const cpSquad = cp?.squadId ? squads.find(s => s.id === cp.squadId) : null;
                        const displaySquad = cpSquad ?? (selectedClient.squadId ? squads.find(s => s.id === selectedClient.squadId) : null);
                        const fieldDefs = PLATFORM_ATTRIBUTE_DEFINITIONS[slug] ?? [];
                        const attrs = cp?.platformAttributes ?? {};

                        const getAttrDisplay = (field: typeof fieldDefs[number]) => {
                          const val = attrs[field.key];
                          if (field.type === 'toggle') return val ? 'Sim' : 'Não';
                          if (field.type === 'select') {
                            if (!val) return '—';
                            const opt = field.options?.find(o => o.value === val);
                            return opt?.label ?? val;
                          }
                          return val ?? '—';
                        };

                        const getReputationBorder = () => {
                          const rep = attrs.reputacao;
                          if (!rep) return '';
                          if (slug === 'mercado_livre') {
                            const map: Record<string, string> = { verde: 'border-l-green-500', amarelo: 'border-l-yellow-500', laranja: 'border-l-orange-500', vermelho: 'border-l-red-500' };
                            return map[rep] ? `border-l-4 ${map[rep]}` : '';
                          }
                          if (slug === 'shein') {
                            const map: Record<string, string> = { L5: 'border-l-green-500', L4: 'border-l-green-500', L3: 'border-l-yellow-500', L2: 'border-l-orange-500', L1: 'border-l-red-500' };
                            return map[rep] ? `border-l-4 ${map[rep]}` : '';
                          }
                          return '';
                        };

                        return (
                          <div
                            key={slug}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('plat-card-slug', slug);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggingPlatCardSlug(slug);
                            }}
                            onDragEnd={() => setDraggingPlatCardSlug(null)}
                            onClick={() => setSelectedPlatform(slug)}
                            className={cn(
                              'bg-card rounded-xl border border-border p-4 shadow-sm-custom hover:shadow-md-custom hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group',
                              getReputationBorder(),
                              draggingPlatCardSlug === slug && 'opacity-50'
                            )}
                          >
                            {/* ── Header ── */}
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="w-8 h-8 rounded-lg bg-accent/60 flex items-center justify-center shrink-0">
                                <ShoppingBag className="w-4 h-4 text-accent-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{plat?.name ?? slug}</h3>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {cp?.qualityLevel && (() => {
                                  const qMap: Record<string, { emoji: string; label: string }> = { seller: { emoji: '🛒', label: 'Seller' }, lojista: { emoji: '🏪', label: 'Lojista' } };
                                  const q = qMap[cp.qualityLevel];
                                  return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-accent text-[10px] font-semibold text-accent-foreground">{q ? `${q.emoji} ${q.label}` : cp.qualityLevel}</span>;
                                })()}
                                {cp?.healthColor && (() => {
                                  const hMap: Record<string, string> = { green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500' };
                                  return <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', hMap[cp.healthColor] ?? 'bg-muted')} title={cp.healthColor} />;
                                })()}
                              </div>
                            </div>

                            {/* ── Context: Squad / Responsável / Contrato ── */}
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-2.5 text-xs">
                              <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                                <Users2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate font-medium text-foreground">{displaySquad?.name ?? '—'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                                <UserCircle className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate font-medium text-foreground">{cp?.responsible || '—'}</span>
                              </div>
                              {cp?.platformAttributes?.tempo_contrato && (
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2 min-w-0">
                                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                  <span className="font-medium text-foreground">{cp.platformAttributes.tempo_contrato} meses</span>
                                </div>
                              )}
                            </div>

                            {/* ── Operational Attributes as badges ── */}
                            {(() => {
                              const summaryBadges = getPlatformAttributeSummary(slug, attrs);
                              return summaryBadges.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mb-2.5 pt-2 border-t border-border/50">
                                  {summaryBadges.map((badge, i) => (
                                    <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-secondary-foreground border border-border/50">
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              ) : null;
                            })()}

                            {/* ── Footer ── */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" />{platProjects.length}</span>
                                <span className="inline-flex items-center gap-1"><ListChecks className="w-3 h-3" />{platTasks.length}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                title="Transferir Plataforma"
                                onClick={(e) => { e.stopPropagation(); setTransferTarget({ platformId: cp?.id ?? '', squadId: cp?.squadId ?? null, responsible: cp?.responsible ?? '' }); }}
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {/* Add new column button */}
              <div className="min-w-[240px] w-[260px] shrink-0">
                <button
                  onClick={() => { setPlatNewColLabel(''); setPlatAddColOpen(true); }}
                  className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Coluna
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Platform Phase Add Column Dialog */}
      <Dialog open={platAddColOpen} onOpenChange={setPlatAddColOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Coluna de Fase</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Nome da coluna</Label>
            <Input
              value={platNewColLabel}
              onChange={(e) => setPlatNewColLabel(e.target.value)}
              placeholder="Ex: Maturação"
              onKeyDown={(e) => e.key === 'Enter' && (() => {
                const label = platNewColLabel.trim();
                if (!label) return;
                const key = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                addPlatPhaseMut.mutate({ key, label, class_name: 'bg-muted text-muted-foreground border-border' });
                setPlatAddColOpen(false);
              })()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlatAddColOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                const label = platNewColLabel.trim();
                if (!label) return;
                const key = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                addPlatPhaseMut.mutate({ key, label, class_name: 'bg-muted text-muted-foreground border-border' });
                setPlatAddColOpen(false);
              }}
              disabled={!platNewColLabel.trim() || addPlatPhaseMut.isPending}
            >
              {addPlatPhaseMut.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Platform Phase Delete Column Confirmation */}
      <AlertDialog open={!!platDeleteColConfirm} onOpenChange={(open) => !open && setPlatDeleteColConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna "{platDeleteColConfirm?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              As plataformas nesta coluna não serão excluídas, mas ficarão sem fase definida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (platDeleteColConfirm) { deletePlatPhaseMut.mutate(platDeleteColConfirm.key); setPlatDeleteColConfirm(null); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Platform Dialog */}
      <Dialog open={addPlatformDialogOpen} onOpenChange={setAddPlatformDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Plataforma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Plataforma</Label>
            <Select value={newPlatformSlug} onValueChange={setNewPlatformSlug}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma plataforma" />
              </SelectTrigger>
              <SelectContent>
                {platformOptions
                  .filter(p => !(selectedClient.platforms ?? []).includes(p.slug))
                  .map(p => (
                    <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPlatformDialogOpen(false)}>Cancelar</Button>
            <Button
              disabled={!newPlatformSlug || addClientPlatformMut.isPending}
              onClick={() => {
                const firstPhase = platformPhaseStatuses.length > 0 ? platformPhaseStatuses[0].key : 'onboarding';
                addClientPlatformMut.mutate({
                  clientId: selectedClient.id,
                  platformSlug: newPlatformSlug,
                  phase: firstPhase,
                  squadId: selectedClient.squadId,
                });
                const currentPlatforms = selectedClient.platforms ?? [];
                updateClientField(selectedClient.id, 'platforms', [...currentPlatforms, newPlatformSlug], 'Plataformas');
                setSelectedClient({ ...selectedClient, platforms: [...currentPlatforms, newPlatformSlug] });
                setAddPlatformDialogOpen(false);
              }}
            >
              {addClientPlatformMut.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generateTarget && (
        <GenerateDemandsDialog
          open={!!generateTarget}
          onOpenChange={(v) => { if (!v) setGenerateTarget(null); }}
          phase={generateTarget.phase}
          clientId={generateTarget.clientId}
          clientName={generateTarget.clientName}
          platformSlug={generateTarget.platformSlug}
          squadId={generateTarget.squadId}
        />
      )}
      {transferTarget && (
        <TransferPlatformDialog
          open={!!transferTarget}
          onOpenChange={(v) => { if (!v) setTransferTarget(null); }}
          platformId={transferTarget.platformId}
          currentSquadId={transferTarget.squadId}
          currentResponsible={transferTarget.responsible}
        />
      )}
    </>
    );
  }

  // Step 3: Show projects of selected client (optionally filtered by platform)
  const currentPlatformData = clientPlatformsData.find(
    cp => cp.clientId === selectedClient.id && cp.platformSlug === selectedPlatform
  );
  const currentPhase = currentPlatformData?.phase ?? 'onboarding';
  const allClientTasks = allTasksData.filter(t => t.clientId === selectedClient.id);
  const filtered = projects
    .filter((p) => p.clientId === selectedClient.id)
    .filter((p) => {
      if (selectedPlatform && selectedPlatform !== 'all') {
        // Show project only if it has at least one task with this platform
        const projectTasks = allClientTasks.filter(t => t.projectId === p.id);
        return projectTasks.some(t => t.platforms?.includes(selectedPlatform));
      }
      return true;
    })
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase())
    );

  const platformLabel = selectedPlatform && selectedPlatform !== 'all'
    ? platformOptions.find(p => p.slug === selectedPlatform)?.name ?? selectedPlatform
    : null;

  return (
    <div className="p-6 animate-fade-in h-full flex flex-col">
      <PageHeader
        title={`Projetos — ${selectedClient.name}${platformLabel ? ` — ${platformLabel}` : ''}`}
        subtitle={`${filtered.filter((p) => p.status === 'in_progress').length} projetos em andamento`}
        actions={
        <>
            <button
            onClick={() => {
              if (selectedPlatform !== null) {
                setSelectedPlatform(null);
              } else {
                setSelectedClient(null);
              }
            }}
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
                  Atribuir Fluxo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenerateTarget({
                  phase: currentPhase,
                  clientId: selectedClient.id,
                  clientName: selectedClient.name,
                  platformSlug: selectedPlatform ?? '',
                  squadId: selectedClient.squadId ?? null,
                })}>
                  <Zap className="w-4 h-4 mr-1" />
                  Gerar Demandas da Fase
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        defaultClientId={selectedClient.id}
        defaultClientName={selectedClient.name}
        defaultPlatformSlug={selectedPlatform && selectedPlatform !== 'all' ? selectedPlatform : undefined}
      />

      <FlowManagerDialog
        open={flowDialogOpen}
        onOpenChange={setFlowDialogOpen}
        mode={flowMode}
        defaultClientId={selectedClient.id}
        defaultClientName={selectedClient.name}
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
          <KanbanView filtered={filtered} clientId={selectedClient.id} clientName={selectedClient.name} squadMembers={selectedSquad.members} platformSlug={selectedPlatform && selectedPlatform !== 'all' ? selectedPlatform : undefined} /> :
          <ListView filtered={filtered} />
          }
        </div>

        <ProjectSummaryPanel projects={filtered} />
      </div>

      {generateTarget && (
        <GenerateDemandsDialog
          open={!!generateTarget}
          onOpenChange={(v) => !v && setGenerateTarget(null)}
          phase={generateTarget.phase}
          clientId={generateTarget.clientId}
          clientName={generateTarget.clientName}
          platformSlug={generateTarget.platformSlug}
          squadId={generateTarget.squadId}
        />
      )}

      {transferTarget && (
        <TransferPlatformDialog
          open={!!transferTarget}
          onOpenChange={(v) => !v && setTransferTarget(null)}
          platformId={transferTarget.platformId}
          currentSquadId={transferTarget.squadId}
          currentResponsible={transferTarget.responsible}
        />
      )}
    </div>);

}

function KanbanView({ filtered, clientId, clientName, squadMembers, platformSlug }: {filtered: Project[]; clientId: string; clientName: string; squadMembers: string[]; platformSlug?: string;}) {
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
        defaultClientId={clientId}
        defaultClientName={clientName}
        defaultPlatformSlug={platformSlug}
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