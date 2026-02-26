import { useState } from 'react';
import { Plus, Search, Building2, Calendar, User, X, Users, Circle } from 'lucide-react';
import { mockAnalysisData } from '@/components/ClientAIAnalysis';
import { squads, projects, tasks } from '@/data/mockData';
import { PageHeader, StatusBadge } from '@/components/ui/shared';
import { clientStatusConfig } from '@/lib/config';
import { Client, ClientStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useClients } from '@/contexts/ClientsContext';
import { AddClientDialog } from '@/components/AddClientDialog';
import { ClientDetailModal } from '@/components/ClientDetailModal';

const statusFilters: { label: string; value: ClientStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Pausados', value: 'paused' },
  { label: 'Churned', value: 'churned' },
];

export function ClientsPage() {
  const { getVisibleClients } = useClients();
  const clients = getVisibleClients();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [healthFilter, setHealthFilter] = useState<'all' | 'green' | 'yellow' | 'red' | 'white'>('all');

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.segment.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSquad = squadFilter === 'all' || c.squadId === squadFilter;
    const matchDateFrom = !dateFrom || c.startDate >= dateFrom;
    const matchDateTo = !dateTo || c.startDate <= dateTo;
    const matchHealth = healthFilter === 'all' || (c.healthColor ?? 'white') === healthFilter;
    return matchSearch && matchStatus && matchSquad && matchDateFrom && matchDateTo && matchHealth;
  });

  const hasDateFilter = dateFrom || dateTo;

  // When selectedClient changes externally (edits), keep it in sync
  const currentClient = selectedClient ? clients.find(c => c.id === selectedClient.id) ?? null : null;

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
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
          value={squadFilter}
          onChange={(e) => setSquadFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground"
        >
          <option value="all">Todos os Squads</option>
          {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value as any)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-foreground"
        >
          <option value="all">Todas as Saúdes</option>
          <option value="green">🟢 Saudável</option>
          <option value="yellow">🟡 Atenção</option>
          <option value="red">🔴 Crítico</option>
          <option value="white">⚪ Não avaliado</option>
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

        <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                statusFilter === f.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((client) => (
          <ClientCard key={client.id} client={client} onClick={() => setSelectedClient(client)} />
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
    </div>
  );
}

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const statusConf = clientStatusConfig[client.status];
  const squad = squads.find((s) => s.id === client.squadId);
  const pendingTasks = tasks.filter((t) => t.clientId === client.id && t.status !== 'done');
  const analysis = mockAnalysisData[client.id];
  const nps = analysis?.satisfactionScore;

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

      {squad && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 mb-3 inline-flex font-medium">
          <Users className="w-3 h-3 shrink-0" />
          {squad.name}
        </div>
      )}

      {pendingTasks.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {pendingTasks.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Circle className="w-3 h-3 text-warning shrink-0" />
              <span className="truncate">{task.title}</span>
            </div>
          ))}
          {pendingTasks.length > 4 && (
            <p className="text-[10px] text-muted-foreground pl-5">+{pendingTasks.length - 4} mais</p>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-border space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-base font-bold text-foreground">{pendingTasks.length}</p>
            <p className="text-[10px] text-muted-foreground">Pendentes</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-foreground">
              {client.monthlyRevenue ? `R$${(client.monthlyRevenue / 1000).toFixed(1)}k` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Mensalidade</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-base font-bold text-foreground">{nps !== undefined ? nps.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-muted-foreground">NPS</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div
              className={cn(
                'w-4 h-4 rounded-full border border-border',
                healthColorMap[client.healthColor ?? 'white']
              )}
              title={`Saúde: ${client.healthColor ?? 'não avaliado'}`}
            />
            <p className="text-[10px] text-muted-foreground mt-1">Saúde</p>
          </div>
        </div>
      </div>
    </div>
  );
}
