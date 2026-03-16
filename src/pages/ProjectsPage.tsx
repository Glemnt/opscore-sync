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
import { useUpdateClientPlatform, useAddClientPlatform, useDeleteClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { getPlatformAttributeSummary, PLATFORM_ATTRIBUTE_DEFINITIONS } from '@/components/PlatformAttributesEditor';
import { format } from 'date-fns';
import { GenerateDemandsDialog } from '@/components/GenerateDemandsDialog';
import { TransferPlatformDialog } from '@/components/TransferPlatformDialog';
import { FlowManagerDialog, FlowDialogMode } from '@/components/FlowManagerDialog';
import { AddPlatformSquadDialog } from '@/components/AddPlatformSquadDialog';
import { EditPlatformDialog } from '@/components/EditPlatformDialog';
import { useTaskTypesMap } from '@/hooks/useTaskTypesQuery';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlatformDetailModal } from '@/components/PlatformDetailModal';

type KanbanColumn = {id: string;label: string;status: ClientStatus | string;};
type ProjectKanbanColumn = {id: string;label: string;status: ProjectStatus | string;};

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
  const { data: clientStatuses = [] } = useClientStatusesQuery('squads');
  const clientStatusMap = useClientStatusesMap();
  const addStatusMut = useAddClientStatus();
  const deleteStatusMut = useDeleteClientStatus();
  const updateStatusMut = useUpdateClientStatus();
  const clients = getVisibleClients();
  const { data: platformOptions = [] } = usePlatformsQuery();
  const { data: clientPlatformsData = [] } = useClientPlatformsQuery();
  const updatePlatformMut = useUpdateClientPlatform();
  const addClientPlatformMut = useAddClientPlatform();
  const deleteClientPlatformMut = useDeleteClientPlatform();
  const [addPlatformDialogOpen, setAddPlatformDialogOpen] = useState(false);
  const [newPlatformSlug, setNewPlatformSlug] = useState('');
  const [platformToRemove, setPlatformToRemove] = useState<{ slug: string; cpId: string | undefined } | null>(null);
  const { data: platformPhaseStatuses = [] } = usePlatformPhaseStatusesQuery();
  const addPlatPhaseMut = useAddPlatformPhaseStatus();
  const deletePlatPhaseMut = useDeletePlatformPhaseStatus();
  const updatePlatPhaseMut = useUpdatePlatformPhaseStatus();
  const reorderPlatPhaseMut = useReorderPlatformPhaseStatuses();
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [showAddPlatformSquad, setShowAddPlatformSquad] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [squadStatusFilter, setSquadStatusFilter] = useState('all');
  const [squadResponsibleFilter, setSquadResponsibleFilter] = useState('all');
  const [squadHealthFilter, setSquadHealthFilter] = useState('all');
  const [squadPlatformFilter, setSquadPlatformFilter] = useState('all');
  const [squadQualityFilter, setSquadQualityFilter] = useState('all');
  const [squadPriorityFilter, setSquadPriorityFilter] = useState('all');
  const [squadDateFrom, setSquadDateFrom] = useState('');
  const [squadDateTo, setSquadDateTo] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [addDemandOpen, setAddDemandOpen] = useState(false);
  const [addColDialogOpen, setAddColDialogOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [deleteColConfirm, setDeleteColConfirm] = useState<{id: string;label: string;status: string;} | null>(null);

  // Generate demands & transfer platform state
  const [generateTarget, setGenerateTarget] = useState<{phase: string;clientId: string;clientName: string;platformSlug: string;squadId: string | null;} | null>(null);
  const [transferTarget, setTransferTarget] = useState<{platformId: string;squadId: string | null;responsible: string;} | null>(null);
  const [flowDialogOpen, setFlowDialogOpen] = useState(false);

  // Platform kanban editing state
  const [platAddColOpen, setPlatAddColOpen] = useState(false);
  const [platNewColLabel, setPlatNewColLabel] = useState('');
  const [platDeleteColConfirm, setPlatDeleteColConfirm] = useState<{key: string;label: string;} | null>(null);
  const [platEditingColKey, setPlatEditingColKey] = useState<string | null>(null);
  const [platDragOverCol, setPlatDragOverCol] = useState<string | null>(null);
  const [draggingPlatColKey, setDraggingPlatColKey] = useState<string | null>(null);
  const [platColDropTarget, setPlatColDropTarget] = useState<string | null>(null);
  const [draggingPlatCardSlug, setDraggingPlatCardSlug] = useState<string | null>(null);
  const [draggingClientId, setDraggingClientId] = useState<string | null>(null);
  const wasDraggingPlatRef = useRef(false);
  const [flowMode, setFlowMode] = useState<FlowDialogMode>('create');
  const [editingPlatform, setEditingPlatform] = useState<import('@/hooks/useClientPlatformsQuery').ClientPlatform | null>(null);
  const [deletingPlatform, setDeletingPlatform] = useState<{ id: string; slug: string; clientId: string } | null>(null);
  const [expandedPlatformEntry, setExpandedPlatformEntry] = useState<{ cp: import('@/hooks/useClientPlatformsQuery').ClientPlatform; client: Client; platformName: string } | null>(null);

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

  const [deleteSquadId, setDeleteSquadId] = useState<string | null>(null);
  const handleDeleteSquad = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteSquadId(id);
  };
  const confirmDeleteSquad = () => {
    if (deleteSquadId) {
      removeSquad(deleteSquadId);
      setDeleteSquadId(null);
    }
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
  { id: 'churned', label: 'Churned', status: 'churned' }]
  );

  // Stable key based on platform phases for orphan detection in Squads kanban
  const platformPhaseKey = clientPlatformsData.map(cp => `${cp.id}:${cp.phase}`).sort().join(',');

  // Sync kanban columns when dynamic statuses load
  useEffect(() => {
    if (clientStatuses.length > 0) {
      const baseCols = clientStatuses.map((s) => ({ id: s.key, label: s.label, status: s.key }));
      const knownKeys = new Set(baseCols.map(c => c.status));
      // Usar phases de plataformas (contexto operacional do Kanban de Squads)
      const orphanStatuses = [...new Set(clientPlatformsData.map(cp => cp.phase))].filter(s => s && !knownKeys.has(s));
      const extraCols = orphanStatuses.map(s => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '), status: s }));
      setClientCols([...baseCols, ...extraCols]);
    }
  }, [clientStatuses, platformPhaseKey]);
  const [dragOverClientCol, setDragOverClientCol] = useState<string | null>(null);

  const isAdmin = currentUser?.accessLevel === 3;
  const visibleSquads = isAdmin ? squads : squads.filter((s) => currentUser?.squadIds.includes(s.id) || s.leader === currentUser?.name);

  // Step 1: Show squads
  if (!selectedSquad) {
    return (
      <div className="p-6 animate-fade-in">
        <PageHeader
          title="Squads"
          subtitle="Selecione um squad para ver os clientes e projetos"
          actions={
          isAdmin ?
          <Button onClick={openAddSquad} className="gradient-primary shadow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Squad
              </Button> :
          undefined
          } />
        
        <div className="grid grid-cols-3 gap-4">
          {visibleSquads.map((squad) => {
            const squadPlatforms = clientPlatformsData.filter(cp => cp.squadId === squad.id);
            const totalPlatforms = squadPlatforms.length;
            // Plataformas ativas = todas exceto as em fase de churn
            const activePlatforms = squadPlatforms.filter(cp => !cp.phase.toLowerCase().includes('churn')).length;
            return (
              <div
                key={squad.id}
                className="bg-card rounded-xl border border-border p-6 shadow-sm-custom hover:shadow-md-custom hover:-translate-y-0.5 transition-all text-left group cursor-pointer relative">
                
                {/* Action buttons — admin only */}
                {isAdmin &&
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                    onClick={(e) => openEditSquad(squad, e)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Editar squad">
                    
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                    onClick={(e) => handleDeleteSquad(squad.id, e)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Apagar squad">
                    
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }

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
                    <span className="font-medium">{totalPlatforms} plataformas</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">{activePlatforms} ativos</span>
                  </div>
                  {(() => {
                    const squadCPs = clientPlatformsData.filter(cp => cp.squadId === squad.id);
                    const platCounts: Record<string, number> = {};
                    squadCPs.forEach(cp => { platCounts[cp.platformSlug] = (platCounts[cp.platformSlug] || 0) + 1; });
                    const entries = Object.entries(platCounts);
                    if (entries.length === 0) return null;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entries.map(([slug, count]) => {
                          const pName = platformOptions.find(p => p.slug === slug)?.name ?? slug;
                          return (
                            <span key={slug} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              {pName} <span className="font-bold text-foreground">{count}</span>
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {squad.members.map((m) =>
                    <Avatar key={m} name={m} size="sm" />
                    )}
                  </div>
                </div>
              </div>);

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
                    {appUsers.map((u) =>
                    <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Membros</Label>
                <div className="flex flex-wrap gap-2">
                  {appUsers.
                  filter((u) => u.name !== squadLeader).
                  map((u) => {
                    const selected = squadMemberNames.includes(u.name);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleMember(u.name)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          selected ?
                          'bg-primary text-primary-foreground border-primary' :
                          'bg-muted text-muted-foreground border-border hover:border-primary/40'
                        )}>
                        
                          {u.name}
                        </button>);

                  })}
                  {appUsers.length === 0 &&
                  <p className="text-xs text-muted-foreground">Nenhum colaborador cadastrado. Adicione em Configurações.</p>
                  }
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

        {/* Delete Squad Confirmation */}
        <AlertDialog open={!!deleteSquadId} onOpenChange={(open) => { if (!open) setDeleteSquadId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Squad</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este squad? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSquad} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>);

  }

  // Step 2: Show clients of selected squad (Kanban by status)
  if (!selectedClient) {
    // Build platform entries for this squad
    const squadPlatformEntries = clientPlatformsData
      .filter(cp => cp.squadId === selectedSquad.id)
      .map(cp => {
        const client = clients.find(c => c.id === cp.clientId);
        const plat = platformOptions.find(p => p.slug === cp.platformSlug);
        return client ? { client, cp, platformName: plat?.name ?? cp.platformSlug } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    const clientIdsWithPlatformsInSquad = new Set(squadPlatformEntries.map(e => e.client.id));
    const squadClients = clients.filter(
      (c) => c.squadId === selectedSquad.id || clientIdsWithPlatformsInSquad.has(c.id)
    );

    const handleRenameCol = (id: string, newLabel: string) => {
      const col = clientCols.find((c) => c.id === id);
      if (col) {
        updateStatusMut.mutate({ key: col.status as string, label: newLabel });
      }
    };

    const handleRemoveCol = (id: string) => {
      const col = clientCols.find((c) => c.id === id);
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


    const phaseLabels: Record<string, string> = {
      onboarding: 'On-board',
      implementacao: 'Implementação',
      performance: 'Performance',
      escala: 'Escala',
    };

    const uniqueResponsibles = [...new Set(squadPlatformEntries.map((e) => e.cp.responsible).filter(Boolean))];

    const filteredPlatformEntries = squadPlatformEntries.filter((e) => {
      const matchSearch = e.client.name.toLowerCase().includes(search.toLowerCase()) || e.platformName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = squadStatusFilter === 'all' || e.cp.phase === squadStatusFilter;
      const matchResponsible = squadResponsibleFilter === 'all' || e.cp.responsible === squadResponsibleFilter;
      const matchHealth = squadHealthFilter === 'all' || (e.cp.healthColor ?? 'white') === squadHealthFilter;
      const matchPlatform = squadPlatformFilter === 'all' || e.cp.platformSlug === squadPlatformFilter;
      const matchQuality = squadQualityFilter === 'all' || (e.cp.qualityLevel ?? '') === squadQualityFilter;
      const matchPriority = squadPriorityFilter === 'all' || allTasksData.some((t) => t.clientId === e.client.id && (t.platforms ?? []).includes(e.cp.platformSlug) && t.priority === squadPriorityFilter);
      const startDate = e.cp.startDate ?? e.client.startDate;
      const matchDateFrom = !squadDateFrom || startDate >= squadDateFrom;
      const matchDateTo = !squadDateTo || startDate <= squadDateTo;
      return matchSearch && matchStatus && matchResponsible && matchHealth && matchPlatform && matchQuality && matchPriority && matchDateFrom && matchDateTo;
    });

    

    return (
      <>
      <div className="p-6 animate-fade-in h-full flex flex-col">
        <PageHeader
          title={selectedSquad.name}
          subtitle={`${squadPlatformEntries.length} plataformas neste squad`}
          actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSquad(null)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Voltar aos Squads
            </button>
            <Button onClick={() => setShowAddPlatformSquad(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Nova Plataforma
            </Button>
          </div>
          } />

        {/* Row 1: Search + filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
            
          </div>

          <select
            value={squadResponsibleFilter}
            onChange={(e) => setSquadResponsibleFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground">
            
            <option value="all">Responsável</option>
            {uniqueResponsibles.map((r) => {
              const count = squadPlatformEntries.filter(e => e.cp.responsible === r).length;
              return <option key={r} value={r}>{r} ({count})</option>;
            })}
          </select>

          <select
            value={squadHealthFilter}
            onChange={(e) => setSquadHealthFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground">
            
            <option value="all">Saúde</option>
            <option value="green">🟢 Saudável</option>
            <option value="yellow">🟡 Atenção</option>
            <option value="red">🔴 Crítico</option>
            <option value="white">⚪ Não avaliado</option>
          </select>

          <select
            value={squadPlatformFilter}
            onChange={(e) => setSquadPlatformFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground">
            
            <option value="all">Plataforma ({squadPlatformEntries.length})</option>
            {platformOptions.map((p) => {
              const count = squadPlatformEntries.filter(e => e.cp.platformSlug === p.slug).length;
              return <option key={p.slug} value={p.slug}>{p.name} ({count})</option>;
            })}
          </select>

          <select
            value={squadQualityFilter}
            onChange={(e) => setSquadQualityFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground">
            <option value="all">Tipo Cliente</option>
            <option value="Seller">🛒 Seller</option>
            <option value="Lojista">🏪 Lojista</option>
          </select>

          <select
            value={squadPriorityFilter}
            onChange={(e) => setSquadPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground">
            <option value="all">Prioridade</option>
            <option value="high">🔴 Alta</option>
            <option value="medium">🟡 Média</option>
            <option value="low">🟢 Baixa</option>
          </select>

          <div className="flex items-center gap-2">
            <input type="date" value={squadDateFrom} onChange={(e) => setSquadDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground" />
            <span className="text-xs text-muted-foreground">até</span>
            <input type="date" value={squadDateTo} onChange={(e) => setSquadDateTo(e.target.value)} className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground" />
            {(squadDateFrom || squadDateTo) &&
            <button onClick={() => {setSquadDateFrom('');setSquadDateTo('');}} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            }
          </div>
        </div>

        {/* Platform summary chips */}
        {(() => {
          const platCounts: Record<string, number> = {};
          squadPlatformEntries.forEach(e => { platCounts[e.cp.platformSlug] = (platCounts[e.cp.platformSlug] || 0) + 1; });
          const entries = Object.entries(platCounts).filter(([, c]) => c > 0);
          if (entries.length === 0) return null;
          return (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                onClick={() => setSquadPlatformFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  squadPlatformFilter === 'all'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                )}>
                Todas ({squadPlatformEntries.length})
              </button>
              {entries.map(([slug, count]) => {
                const pName = platformOptions.find(p => p.slug === slug)?.name ?? slug;
                return (
                  <button
                    key={slug}
                    onClick={() => setSquadPlatformFilter(squadPlatformFilter === slug ? 'all' : slug)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      squadPlatformFilter === slug
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                    )}>
                    {pName} ({count})
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Row 2: Phase filter tabs */}
        <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-1 mb-5">
          <button
            onClick={() => setSquadStatusFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              squadStatusFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}>
            Todos
            <span className={cn('ml-1.5 text-[10px]', squadStatusFilter === 'all' ? 'bg-primary-foreground/20 rounded-full px-1.5' : 'opacity-70')}>{squadPlatformEntries.length}</span>
          </button>
          {clientCols.map((col) => (
            <div key={col.id} className="relative group flex items-center">
              <button
                onClick={() => setSquadStatusFilter(col.status as string)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  squadStatusFilter === col.status ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}>
                {col.label}
                <span className={cn('ml-1.5 text-[10px]', squadStatusFilter === col.status ? 'bg-primary-foreground/20 rounded-full px-1.5' : 'opacity-70')}>{squadPlatformEntries.filter(e => e.cp.phase === col.status).length}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveCol(col.id); }}
                className="ml-0.5 p-0.5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover fase">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddCol}
            className="px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            title="Nova Fase">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>


        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
          {filteredPlatformEntries.map((entry) => {
                    const { client, cp, platformName } = entry;
                    const cpSquad = cp.squadId ? squads.find((s) => s.id === cp.squadId) : null;
                    const displaySquad = cpSquad ?? (client.squadId ? squads.find((s) => s.id === client.squadId) : null);
                    const attrs = cp.platformAttributes ?? {};
                    const summaryBadges = getPlatformAttributeSummary(cp.platformSlug, attrs);

                    return (
                      <div
                        key={cp.id}
                        onClick={() => { setExpandedPlatformEntry({ cp, client, platformName }); }}
                        className="w-full bg-card rounded-xl border border-border p-4 shadow-sm-custom hover:shadow-md-custom hover:-translate-y-0.5 transition-all text-left group cursor-pointer">
                        
                        {/* Header: Client + Platform */}
                        <div className="flex items-start justify-between mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {client.name}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {cp.qualityLevel && (() => {
                              const qMap: Record<string, {emoji: string; label: string}> = { Seller: { emoji: '🛒', label: 'Seller' }, Lojista: { emoji: '🏪', label: 'Lojista' } };
                              const q = qMap[cp.qualityLevel];
                              return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-accent text-[10px] font-semibold text-accent-foreground">{q ? `${q.emoji} ${q.label}` : cp.qualityLevel}</span>;
                            })()}
                          </div>
                        </div>

                        {/* Context: Squad / Responsible */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-2.5 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                            <Users2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate font-medium text-foreground">{displaySquad?.name ?? '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                            <UserCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate font-medium text-foreground">{cp.responsible || '—'}</span>
                          </div>
                        </div>

                        {/* Health badge */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5 pt-2 border-t border-border/50">
                        {(() => {
                            const hMap: Record<string, { emoji: string; label: string; cls: string }> = {
                              green: { emoji: '🟢', label: 'Excelente', cls: 'bg-success/15 text-success border-success/30' },
                              yellow: { emoji: '🟡', label: 'Atenção', cls: 'bg-warning/15 text-warning border-warning/30' },
                              red: { emoji: '🔴', label: 'Ruim', cls: 'bg-destructive/15 text-destructive border-destructive/30' },
                              white: { emoji: '⚪', label: 'Não avaliado', cls: 'bg-muted text-muted-foreground border-border/50' },
                            };
                            const h = cp.healthColor ? hMap[cp.healthColor] : null;
                            return (
                              <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border', h ? h.cls : 'bg-muted text-muted-foreground border-border/50')}>
                                {h ? `${h.emoji} ${h.label}` : '— Saúde'}
                              </span>
                            );
                          })()}

                          {/* Platform badge */}
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-semibold text-primary border border-primary/20">
                            {platformName}
                          </span>
                        </div>

                        {/* Full / Flex / Turbo badges (Mercado Livre only) */}
                        {cp.platformSlug === 'mercado_livre' && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {[
                              { key: 'envios_full', label: 'Full' },
                              { key: 'envios_flex', label: 'Flex' },
                              { key: 'envios_turbo', label: 'Turbo' },
                            ].map((item) => {
                              const active = !!attrs[item.key];
                              return (
                                <span
                                  key={item.key}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border',
                                    active
                                      ? 'bg-success/15 text-success border-success/30'
                                      : 'bg-muted text-muted-foreground border-border/50'
                                  )}
                                >
                                  {active ? '✓' : '✗'} {item.label}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Other attribute badges (non-ML) */}
                        {cp.platformSlug !== 'mercado_livre' && summaryBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {summaryBadges.map((badge, i) => (
                              <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-secondary-foreground border border-border/50">
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer: Phase + Actions */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                          <span className="text-xs font-medium text-muted-foreground">{phaseLabels[cp.phase] ?? cp.phase}</span>
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Editar"
                              onClick={(e) => { e.stopPropagation(); setEditingPlatform(cp); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Transferir"
                              onClick={(e) => { e.stopPropagation(); setTransferTarget({ platformId: cp.id, squadId: cp.squadId, responsible: cp.responsible }); }}>
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" title="Excluir"
                              onClick={(e) => { e.stopPropagation(); setDeletingPlatform({ id: cp.id, slug: cp.platformSlug, clientId: cp.clientId }); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
          })}
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
                autoFocus />
              
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
      <AddPlatformSquadDialog
        open={showAddPlatformSquad}
        onClose={() => setShowAddPlatformSquad(false)}
        defaultSquadId={selectedSquad.id}
      />
      {editingPlatform && (
        <EditPlatformDialog
          open={!!editingPlatform}
          onClose={() => setEditingPlatform(null)}
          platform={editingPlatform}
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
      <AlertDialog open={!!deletingPlatform} onOpenChange={(open) => { if (!open) setDeletingPlatform(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plataforma?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{platformOptions.find(p => p.slug === deletingPlatform?.slug)?.name ?? deletingPlatform?.slug}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deletingPlatform) return;
                deleteClientPlatformMut.mutate(deletingPlatform.id);
                const client = clients.find(c => c.id === deletingPlatform.clientId);
                if (client) {
                  const currentSlugs = client.platforms ?? [];
                  const newPlatforms = currentSlugs.filter((s) => s !== deletingPlatform.slug);
                  updateClientField(client.id, 'platforms', newPlatforms, 'Plataformas');
                }
                setDeletingPlatform(null);
              }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {expandedPlatformEntry && (
        <PlatformDetailModal
          open={!!expandedPlatformEntry}
          onClose={() => setExpandedPlatformEntry(null)}
          clientPlatform={expandedPlatformEntry.cp}
          client={expandedPlatformEntry.client}
          platformName={expandedPlatformEntry.platformName}
          onViewDemands={() => {
            setSelectedClient(expandedPlatformEntry.client);
            setSelectedPlatform(expandedPlatformEntry.cp.platformSlug);
            setExpandedPlatformEntry(null);
          }}
        />
      )}
      </>);

  }

  // If no platform selected yet, default to first available or 'all'
  if (selectedPlatform === null) {
    const firstPlatform = (selectedClient.platforms ?? [])[0];
    setSelectedPlatform(firstPlatform ?? 'all');
    return null;
  }

  // Step 3: Show projects of selected client (optionally filtered by platform)
  const currentPlatformData = clientPlatformsData.find(
    (cp) => cp.clientId === selectedClient.id && cp.platformSlug === selectedPlatform
  );
  const currentPhase = currentPlatformData?.phase ?? 'onboarding';
  const allClientTasks = allTasksData.filter((t) => t.clientId === selectedClient.id);
  const filtered = projects.
  filter((p) => p.clientId === selectedClient.id).
  filter((p) => {
    if (selectedPlatform && selectedPlatform !== 'all') {
      // Show project only if it has at least one task with this platform
      const projectTasks = allClientTasks.filter((t) => t.projectId === p.id);
      return projectTasks.some((t) => t.platforms?.includes(selectedPlatform));
    }
    return true;
  }).
  filter((p) =>
  p.name.toLowerCase().includes(search.toLowerCase()) ||
  p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const platformLabel = selectedPlatform && selectedPlatform !== 'all' ?
  platformOptions.find((p) => p.slug === selectedPlatform)?.name ?? selectedPlatform :
  null;

  return (
    <div className="p-6 animate-fade-in h-full flex flex-col">
      <PageHeader
        title={`Projetos — ${selectedClient.name}${platformLabel ? ` — ${platformLabel}` : ''}`}
        subtitle={`${filtered.filter((p) => p.status === 'in_progress').length} projetos em andamento`}
        actions={
        <>
            <button
            onClick={() => {
              setSelectedClient(null);
              setSelectedPlatform(null);
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
                <DropdownMenuItem onClick={() => {setFlowMode('create');setFlowDialogOpen(true);}}>
                  Criar Fluxo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {setFlowMode('edit');setFlowDialogOpen(true);}}>
                  Editar Fluxo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {setFlowMode('assign');setFlowDialogOpen(true);}}>
                  Atribuir Fluxo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGenerateTarget({
                phase: currentPhase,
                clientId: selectedClient.id,
                clientName: selectedClient.name,
                platformSlug: selectedPlatform ?? '',
                squadId: selectedClient.squadId ?? null
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
        defaultPlatformSlug={selectedPlatform && selectedPlatform !== 'all' ? selectedPlatform : undefined} />
      

      <FlowManagerDialog
        open={flowDialogOpen}
        onOpenChange={setFlowDialogOpen}
        mode={flowMode}
        defaultClientId={selectedClient.id}
        defaultClientName={selectedClient.name} />
      

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

      {generateTarget &&
      <GenerateDemandsDialog
        open={!!generateTarget}
        onOpenChange={(v) => !v && setGenerateTarget(null)}
        phase={generateTarget.phase}
        clientId={generateTarget.clientId}
        clientName={generateTarget.clientName}
        platformSlug={generateTarget.platformSlug}
        squadId={generateTarget.squadId} />

      }

      {transferTarget &&
      <TransferPlatformDialog
        open={!!transferTarget}
        onOpenChange={(v) => !v && setTransferTarget(null)}
        platformId={transferTarget.platformId}
        currentSquadId={transferTarget.squadId}
        currentResponsible={transferTarget.responsible} />

      }
    </div>);

}

function KanbanView({ filtered, clientId, clientName, squadMembers, platformSlug }: {filtered: Project[];clientId: string;clientName: string;squadMembers: string[];platformSlug?: string;}) {
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
  { id: 'done', label: 'Concluído', status: 'done' }]
  );
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [demandDialog, setDemandDialog] = useState<{open: boolean;status: TaskStatus;}>({ open: false, status: 'backlog' });
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [draggingKanbanColId, setDraggingKanbanColId] = useState<string | null>(null);
  const [kanbanColDropTarget, setKanbanColDropTarget] = useState<string | null>(null);

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
      progress: 0
    };
    setLocalProjects((prev) => [...prev, newProject]);
  };

  const handleRenameCol = (id: string, newLabel: string) => {
    setCols((c) => c.map((col) => col.id === id ? { ...col, label: newLabel } : col));
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
    return allTasks.filter((t) => {
      if (t.clientId !== clientId || t.status !== colStatus) return false;
      if (platformSlug) return t.platforms?.includes(platformSlug);
      return true;
    });
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
              className="flex-shrink-0 w-72 group/col flex flex-col"
              onDragOver={(e) => {e.preventDefault();setDragOverCol(col.id);}}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(col.status, e)}>
              
              <div
                className={cn("flex items-center gap-2 mb-3 cursor-grab active:cursor-grabbing select-none", draggingKanbanColId === col.id && 'opacity-50')}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/col-id', col.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggingKanbanColId(col.id);
                }}
                onDragEnd={() => setDraggingKanbanColId(null)}
                onDragOver={(e) => {
                  if (!draggingKanbanColId || draggingKanbanColId === col.id) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setKanbanColDropTarget(col.id);
                }}
                onDrop={(e) => {
                  if (!draggingKanbanColId || draggingKanbanColId === col.id) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const fromIdx = cols.findIndex(c => c.id === draggingKanbanColId);
                  const toIdx = cols.findIndex(c => c.id === col.id);
                  if (fromIdx !== -1 && toIdx !== -1) {
                    const updated = [...cols];
                    const [moved] = updated.splice(fromIdx, 1);
                    updated.splice(toIdx, 0, moved);
                    setCols(updated);
                  }
                  setDraggingKanbanColId(null);
                  setKanbanColDropTarget(null);
                }}
              >
                {kanbanColDropTarget === col.id && <div className="w-1 h-6 bg-primary rounded-full" />}
                {conf && <div className={cn('w-2 h-2 rounded-full', conf.dot)} />}
                {editingColId === col.id ?
                <EditableColInput
                  value={col.label}
                  onSave={(v) => handleRenameCol(col.id, v)}
                  onCancel={() => setEditingColId(null)} /> :
                <button onClick={() => setEditingColId(col.id)} className="cursor-text">
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  </button>
                }
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                  {colTasks.length}
                </span>
                <button
                  onClick={() => handleRemoveCol(col.id)}
                  className="ml-auto opacity-0 group-hover/col:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Remover coluna">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={cn(
                'space-y-3 min-h-[60px] rounded-xl transition-all duration-200 p-1 flex-1 flex flex-col gap-3',
                dragOverCol === col.id && 'drop-zone-highlight'
              )}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => { e.stopPropagation(); handleDrop(col.status, e); }}
              >
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
                      onDelete={() => deleteTask(task.id)} />);


                })}
                {colProjects.filter((p) => !colTasks.some((t) => t.title === p.name)).map((project) =>
                <ProjectCard key={project.id} project={project} />
                )}
                <button
                  onClick={() => setDemandDialog({ open: true, status: col.status as TaskStatus || 'backlog' })}
                  className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                  
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar demanda
                </button>
              </div>
            </div>);
        })}
        <div className="flex-shrink-0 w-72">
          <button
            onClick={handleAddCol}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
            
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
        defaultPlatformSlug={platformSlug} />
      

      <TaskDetailModal
        task={liveSelectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => {if (!open) setSelectedTask(null);}} />
      
    </>);

}

function DemandCard({ task, onClick, canDelete, onDelete }: {task: import('@/types').Task;onClick: () => void;canDelete: boolean;onDelete: () => void;}) {
  const subtasks = task.subtasks ?? [];
  const progress = subtasks.length > 0 ? Math.round(subtasks.filter((s) => s.done).length / subtasks.length * 100) : -1;
  const taskTypeMap = useTaskTypesMap();
  const typeConf = taskTypeMap[task.type] ?? { label: task.type, color: 'bg-muted text-muted-foreground' };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={(e) => { handleDragStart(e); e.currentTarget.classList.add('dragging-card'); }}
      onDragEnd={(e) => { e.currentTarget.classList.remove('dragging-card'); }}
      onClick={onClick}
      className="bg-card rounded-xl border border-border p-4 shadow-sm-custom hover:shadow-md-custom transition-all cursor-grab active:cursor-grabbing">
      
      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-2">{task.title}</p>
      <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium mb-2 inline-block', typeConf.color)}>
        {typeConf.label}
      </span>
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={task.responsible} size="sm" />
        <span className="text-xs text-muted-foreground truncate">{task.responsible}</span>
      </div>
      {progress >= 0 &&
      <div className="mb-2">
          <ProgressBar value={progress} className="mb-1" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Subtarefas</span>
            <span className="font-medium">{progress}%</span>
          </div>
        </div>
      }
      {task.comments &&
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-2">
          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{task.comments}</span>
        </div>
      }
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(task.deadline).toLocaleDateString('pt-BR')}
        </div>
        {canDelete &&
        <button
          onClick={(e) => {e.stopPropagation();onDelete();}}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Excluir demanda">
          
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        }
      </div>
    </div>);

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

function EditableColInput({ value, onSave, onCancel }: {value: string;onSave: (v: string) => void;onCancel: () => void;}) {
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
      className="text-sm font-medium bg-background border border-primary/30 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 w-32" />);


}