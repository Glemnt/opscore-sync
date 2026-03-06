import { useState } from 'react';
import { Workflow } from 'lucide-react';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { Plus, Search, Building2, Calendar, User, X, Users, Circle, ShoppingBag, Settings2, Trash2, Phone, Mail, FileText } from 'lucide-react';
import { mockAnalysisData } from '@/components/ClientAIAnalysis';
import { getPlatformAttributeSummary } from '@/components/PlatformAttributesEditor';
import { useSquads } from '@/contexts/SquadsContext';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useProjectsQuery } from '@/hooks/useProjectsQuery';
import { useTasks } from '@/contexts/TasksContext';
import { useClientFlowsQuery } from '@/hooks/useClientFlowsQuery';
import { PageHeader, StatusBadge } from '@/components/ui/shared';
import { Client, ClientStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useClients } from '@/contexts/ClientsContext';
import { AddClientDialog } from '@/components/AddClientDialog';
import { ClientDetailModal } from '@/components/ClientDetailModal';
import { useClientStatusesQuery, useClientStatusesMap, useAddClientStatus, useDeleteClientStatus } from '@/hooks/useClientStatusesQuery';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const COLOR_OPTIONS = [
  { label: 'Verde', value: 'bg-success-light text-success border-success/20' },
  { label: 'Amarelo', value: 'bg-warning-light text-warning border-warning/20' },
  { label: 'Vermelho', value: 'bg-destructive/10 text-destructive border-destructive/20' },
  { label: 'Azul', value: 'bg-info-light text-info border-info/20' },
  { label: 'Cinza', value: 'bg-muted text-muted-foreground border-border' },
  { label: 'Roxo', value: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: 'Rosa', value: 'bg-pink-100 text-pink-700 border-pink-200' },
  { label: 'Laranja', value: 'bg-orange-100 text-orange-700 border-orange-200' },
];

export function ClientsPage() {
  const { getVisibleClients, updateClient } = useClients();
  const { squads } = useSquads();
  const { data: projects = [] } = useProjectsQuery();
  const { tasks } = useTasks();
  const { data: clientFlowsMap = {} } = useClientFlowsQuery();
  const clients = getVisibleClients();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [healthFilter, setHealthFilter] = useState<'all' | 'green' | 'yellow' | 'red' | 'white'>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [addStatusOpen, setAddStatusOpen] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState(COLOR_OPTIONS[0].value);

  const { data: clientStatuses = [] } = useClientStatusesQuery();
  const statusMap = useClientStatusesMap();
  const addStatusMutation = useAddClientStatus();
  const deleteStatusMutation = useDeleteClientStatus();
  const [deletingStatusKey, setDeletingStatusKey] = useState<string | null>(null);

  const knownStatusKeys = new Set(clientStatuses.map(s => s.key));
  const orphanStatuses = [...new Set(clients.map(c => c.status))].filter(s => !knownStatusKeys.has(s));
  const statusFilters = [
    { label: 'Todos', value: 'all' },
    ...clientStatuses.map(s => ({ label: s.label, value: s.key })),
    ...orphanStatuses.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '), value: s })),
  ];

  const { data: platforms = [] } = usePlatformsQuery();
  const uniqueResponsibles = [...new Set(clients.map(c => c.responsible).filter(Boolean))];

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.segment.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSquad = squadFilter === 'all' || c.squadId === squadFilter;
    const matchDateFrom = !dateFrom || c.startDate >= dateFrom;
    const matchDateTo = !dateTo || c.startDate <= dateTo;
    const matchHealth = healthFilter === 'all' || (c.healthColor ?? 'white') === healthFilter;
    const matchResponsible = responsibleFilter === 'all' || c.responsible === responsibleFilter;
    const matchPlatform = platformFilter === 'all' || (c.platforms?.includes(platformFilter) ?? false);
    return matchSearch && matchStatus && matchSquad && matchDateFrom && matchDateTo && matchHealth && matchResponsible && matchPlatform;
  });

  const hasDateFilter = dateFrom || dateTo;
  const currentClient = selectedClient ? clients.find(c => c.id === selectedClient.id) ?? null : null;

  const handleAddStatus = () => {
    if (!newStatusLabel.trim()) return;
    const key = newStatusLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    addStatusMutation.mutate({ key, label: newStatusLabel.trim(), class_name: newStatusColor }, {
      onSuccess: () => { setAddStatusOpen(false); setNewStatusLabel(''); setNewStatusColor(COLOR_OPTIONS[0].value); },
    });
  };

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.filter((c) => c.status === 'active').length} clientes ativos`}
        actions={
          <button
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-medium shadow-primary hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        }
      />

      {/* Filters Row 1: Search + Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        <select
          value={responsibleFilter}
          onChange={(e) => setResponsibleFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground"
        >
          <option value="all">Responsável</option>
          {uniqueResponsibles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={squadFilter}
          onChange={(e) => setSquadFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground"
        >
          <option value="all">Squad</option>
          {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value as any)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground"
        >
          <option value="all">Saúde</option>
          <option value="green">🟢 Saudável</option>
          <option value="yellow">🟡 Atenção</option>
          <option value="red">🔴 Crítico</option>
          <option value="white">⚪ Não avaliado</option>
        </select>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground"
        >
          <option value="all">Plataforma</option>
          {platforms.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground" />
          <span className="text-xs text-muted-foreground">até</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground" />
          {hasDateFilter && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Row 2: Pipeline Status Tabs */}
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-1 mb-5">
        {statusFilters.map((f) => (
          <div key={f.value} className="relative group flex items-center">
            <button
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                statusFilter === f.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {f.label}
            </button>
            {f.value !== 'all' && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeletingStatusKey(f.value); }}
                className="ml-0.5 p-0.5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                title="Excluir status"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setAddStatusOpen(true)}
          className="px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          title="Novo Status"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((client) => (
          <ClientCard key={client.id} client={client} statusMap={statusMap} clientFlows={clientFlowsMap[client.id] ?? []} onClick={() => setSelectedClient(client)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhum cliente encontrado com os filtros selecionados.
        </div>
      )}

      <AddClientDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />

      <ClientDetailModal
        client={currentClient}
        open={!!currentClient}
        onClose={() => setSelectedClient(null)}
      />

      {/* Add Status Dialog */}
      <Dialog open={addStatusOpen} onOpenChange={setAddStatusOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Status</Label>
              <Input value={newStatusLabel} onChange={(e) => setNewStatusLabel(e.target.value)} placeholder="Ex: Em análise" />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewStatusColor(opt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      opt.value,
                      newStatusColor === opt.value && 'ring-2 ring-primary/40 scale-105'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStatusOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddStatus} disabled={!newStatusLabel.trim() || addStatusMutation.isPending}>
              Criar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Status Confirm */}
      <AlertDialog open={!!deletingStatusKey} onOpenChange={(open) => { if (!open) setDeletingStatusKey(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir status</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o status <strong>{deletingStatusKey ? (statusMap[deletingStatusKey]?.label ?? deletingStatusKey) : ''}</strong>? Clientes com esse status não serão afetados, mas o filtro será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingStatusKey) {
                  const isOrphan = !clientStatuses.find(s => s.key === deletingStatusKey);
                  if (isOrphan) {
                    const firstValid = clientStatuses[0]?.key ?? 'active';
                    clients
                      .filter(c => c.status === deletingStatusKey)
                      .forEach(c => updateClient(c.id, { status: firstValid }));
                    if (statusFilter === deletingStatusKey) setStatusFilter('all');
                    setDeletingStatusKey(null);
                  } else {
                    deleteStatusMutation.mutate(deletingStatusKey, {
                      onSuccess: () => {
                        if (statusFilter === deletingStatusKey) setStatusFilter('all');
                        setDeletingStatusKey(null);
                      },
                    });
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClientCard({ client, statusMap, clientFlows, onClick }: { client: Client; statusMap: Record<string, { label: string; className: string }>; clientFlows: { flowId: string; flowName: string }[]; onClick: () => void }) {
  const statusConf = statusMap[client.status] ?? { label: client.status, className: 'bg-muted text-muted-foreground border-border' };
  const { squads } = useSquads();
  const { tasks } = useTasks();
  const { data: platforms = [] } = usePlatformsQuery();
  const { data: allClientPlatforms = [] } = useClientPlatformsQuery();
  const squad = squads.find((s) => s.id === client.squadId);
  const pendingTasks = tasks.filter((t) => t.clientId === client.id && t.status !== 'done');
  const analysis = mockAnalysisData[client.id];
  const nps = analysis?.satisfactionScore;
  const clientCPs = allClientPlatforms.filter(cp => cp.clientId === client.id);

  const healthColorMap: Record<string, string> = {
    green: 'bg-success',
    yellow: 'bg-warning',
    red: 'bg-destructive',
    white: 'bg-border',
  };

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl border border-border p-5 shadow-sm-custom hover:shadow-md-custom transition-all hover:-translate-y-0.5 cursor-pointer group"
    >
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

      {/* Context line: Squad + Platforms + Health */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {squad && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
            <Users className="w-3 h-3 shrink-0" />
            {squad.name}
          </span>
        )}
        {client.platforms && client.platforms.length > 0 && client.platforms.map((slug) => {
          const plat = platforms.find((p) => p.slug === slug);
          return (
            <span key={slug} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
              <ShoppingBag className="w-3 h-3 shrink-0" />
              {plat?.name ?? slug}
            </span>
          );
        })}
        <div
          className={cn(
            'w-3.5 h-3.5 rounded-full border border-border shrink-0 ml-auto',
            healthColorMap[client.healthColor ?? 'white']
          )}
          title={`Saúde: ${client.healthColor ?? 'não avaliado'}`}
        />
      </div>

      {/* Metadata line: Responsible + Entry Date */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {client.responsible && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
            <User className="w-3 h-3 shrink-0" />
            {client.responsible}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
          <Calendar className="w-3 h-3 shrink-0" />
          {new Date(client.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
        </span>
        {client.phone && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
            <Phone className="w-3 h-3 shrink-0" />
            {client.phone}
          </span>
        )}
        {client.email && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
            <Mail className="w-3 h-3 shrink-0" />
            {client.email}
          </span>
        )}
        {client.cnpj && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 font-medium">
            <FileText className="w-3 h-3 shrink-0" />
            {client.cnpj}
          </span>
        )}
      </div>

      {/* Metrics grid */}
      <div className="pt-3 border-t border-border">
        <div className="grid grid-cols-5 gap-1">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{pendingTasks.length}</p>
            <p className="text-[10px] text-muted-foreground">Pendentes</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              {client.monthlyRevenue ? `R$${(client.monthlyRevenue / 1000).toFixed(1)}k` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Mensalidade</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              {client.setupFee ? `R$${(client.setupFee / 1000).toFixed(1)}k` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Setup</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              {client.contractDurationMonths ? `${client.contractDurationMonths}m` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Contrato</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{nps !== undefined ? nps.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-muted-foreground">NPS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
