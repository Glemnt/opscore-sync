import { useState, useMemo, useRef, useEffect } from 'react';
import { Building2, Calendar as CalendarIcon, Clock, User, CheckCircle2, AlertCircle, ClipboardList, Circle, Send, History, Edit3, Save, X, FileText, Upload, Eye, Trash2, Pencil, Plus, Workflow, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/shared';
import { taskStatusConfig, taskTypeConfig } from '@/lib/config';
import { Client, Task, ClientStatus, ContractType, Platform, Squad } from '@/types';
import { usePlatformsQuery, PlatformRow } from '@/hooks/usePlatformsQuery';
import { useTaskTypesMap } from '@/hooks/useTaskTypesQuery';
import { useClientStatusesQuery, useClientStatusesMap } from '@/hooks/useClientStatusesQuery';
import { cn } from '@/lib/utils';
import { useSquads } from '@/contexts/SquadsContext';
import { useProjectsQuery } from '@/hooks/useProjectsQuery';
import { useTasks } from '@/contexts/TasksContext';
import { useClients } from '@/contexts/ClientsContext';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { ClientAIAnalysis } from '@/components/ClientAIAnalysis';
import { useClientFlowsQuery, useAddClientFlow, useRemoveClientFlow } from '@/hooks/useClientFlowsQuery';
import { useFlowsQuery } from '@/hooks/useFlowsQuery';
import { useClientPlatformsQuery, useAddClientPlatform, useUpdateClientPlatform } from '@/hooks/useClientPlatformsQuery';
import type { ClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { PlatformAttributesEditor } from '@/components/PlatformAttributesEditor';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// ─── Platform Operational Panel ───
function PlatformOperationalPanel({ client, platformOptions, squads, appUsers, tasks, clientStatuses }: {
  client: Client;
  platformOptions: PlatformRow[];
  squads: Squad[];
  appUsers: any[];
  tasks: Task[];
  clientStatuses: any[];
}) {
  const { data: clientPlatforms = [] } = useClientPlatformsQuery();
  const addPlatform = useAddClientPlatform();
  const updatePlatform = useUpdateClientPlatform();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const platforms = client.platforms ?? [];
  const cpMap = useMemo(() => {
    const map: Record<string, ClientPlatform> = {};
    for (const cp of clientPlatforms) {
      if (cp.clientId === client.id) map[cp.platformSlug] = cp;
    }
    return map;
  }, [clientPlatforms, client.id]);

  // Auto-seed missing platform records
  useEffect(() => {
    for (const slug of platforms) {
      if (!cpMap[slug]) {
        addPlatform.mutate({ clientId: client.id, platformSlug: slug, squadId: client.squadId || null });
      }
    }
  }, [platforms.join(','), Object.keys(cpMap).join(',')]);

  return (
    <div className="mt-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Plataformas (Operacional)</p>
      <div className="space-y-2">
        {platforms.map((slug) => {
          const plat = platformOptions.find(p => p.slug === slug);
          const cp = cpMap[slug];
          const platTasks = tasks.filter(t => t.platforms?.includes(slug));
          const pendingCount = platTasks.filter(t => t.status !== 'done').length;
          const isExpanded = expandedSlug === slug;
          const platSquad = cp?.squadId ? squads.find(s => s.id === cp.squadId) : null;

          return (
            <div key={slug} className="border border-border rounded-lg bg-muted/30 overflow-hidden">
              <button
                onClick={() => setExpandedSlug(isExpanded ? null : slug)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-semibold text-foreground">{plat?.name ?? slug}</span>
                  {cp && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {clientStatuses.find(s => s.key === cp.phase)?.label ?? cp.phase}
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                      {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && cp && (
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Fase</label>
                      <select
                        value={cp.phase}
                        onChange={e => updatePlatform.mutate({ id: cp.id, updates: { phase: e.target.value } })}
                        className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                      >
                        {clientStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Squad Operacional</label>
                      <select
                        value={cp.squadId ?? ''}
                        onChange={e => updatePlatform.mutate({ id: cp.id, updates: { squad_id: e.target.value || null } })}
                        className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                      >
                        <option value="">—</option>
                        {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Responsável</label>
                      <select
                        value={cp.responsible}
                        onChange={e => updatePlatform.mutate({ id: cp.id, updates: { responsible: e.target.value } })}
                        className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                      >
                        <option value="">—</option>
                        {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Tempo de Contrato</label>
                      <select
                        value={cp.platformAttributes?.tempo_contrato ?? ''}
                        onChange={e => updatePlatform.mutate({ id: cp.id, updates: { platformAttributes: { ...cp.platformAttributes, tempo_contrato: e.target.value || '' } } })}
                        className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                      >
                        <option value="">—</option>
                        <option value="6">6 meses</option>
                        <option value="12">12 meses</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Nível de Qualidade</label>
                      <select
                        value={cp.qualityLevel ?? ''}
                        onChange={e => updatePlatform.mutate({ id: cp.id, updates: { qualityLevel: e.target.value || null } })}
                        className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                      >
                        <option value="">—</option>
                        <option value="iniciante">🥉 Iniciante</option>
                        <option value="estruturado">🥈 Estruturado</option>
                        <option value="competitivo">🥇 Competitivo</option>
                        <option value="escalando">🚀 Escalando</option>
                        <option value="dominante">👑 Dominante</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Saúde da Plataforma</label>
                      <select
                        value={cp.healthColor ?? ''}
                        onChange={e => updatePlatform.mutate({ id: cp.id, updates: { healthColor: e.target.value || null } })}
                        className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                      >
                        <option value="">—</option>
                        <option value="green">🟢 Excelente</option>
                        <option value="orange">🟠 Mediano</option>
                        <option value="red">🔴 Ruim</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span>{platTasks.length} demandas</span>
                    <span>•</span>
                    <span>{pendingCount} pendentes</span>
                    {platSquad && platSquad.id !== client.squadId && (
                      <>
                        <span>•</span>
                        <span className="text-primary font-medium">Squad: {platSquad.name}</span>
                      </>
                    )}
                  </div>
                  <PlatformAttributesEditor
                    platformSlug={slug}
                    attributes={cp.platformAttributes ?? {}}
                    onChange={(key, value) => {
                      const newAttrs = { ...cp.platformAttributes, [key]: value };
                      updatePlatform.mutate({ id: cp.id, updates: { platformAttributes: newAttrs } });
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ClientDetailModalProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
}

export function ClientDetailModal({ client, open, onClose }: ClientDetailModalProps) {
  const { updateClientField, addChatNote, deleteClient, updateClient } = useClients();
  const { squads } = useSquads();
  const { data: projects = [] } = useProjectsQuery();
  const { data: platformOptions = [] } = usePlatformsQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { tasks } = useTasks();
  const { data: clientFlowsMap = {} } = useClientFlowsQuery();
  const { data: allFlows = [] } = useFlowsQuery();
  const addClientFlow = useAddClientFlow();
  const removeClientFlow = useRemoveClientFlow();
  const [showFlowSelect, setShowFlowSelect] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [noteMessage, setNoteMessage] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Client>>({});

  const nextPaymentDate = useMemo(() => {
    if (!client) return '';
    const now = new Date();
    const start = new Date(client.startDate + 'T00:00:00');

    if (client.contractType === 'mrr') {
      const candidate = new Date(now.getFullYear(), now.getMonth(), client.paymentDay);
      if (candidate <= now) {
        candidate.setMonth(candidate.getMonth() + 1);
      }
      return candidate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } else {
      const interval = client.contractDurationMonths ?? 3;
      let next = new Date(start);
      next.setMonth(next.getMonth() + interval);
      while (next <= now) {
        next.setMonth(next.getMonth() + interval);
      }
      return next.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }, [client?.startDate, client?.contractType, client?.paymentDay, client?.contractDurationMonths]);

  const statusMap = useClientStatusesMap();
  const { data: clientStatuses = [] } = useClientStatusesQuery();

  if (!client) return null;

  const statusConf = statusMap[client.status] ?? { label: client.status, className: 'bg-muted text-muted-foreground border-border' };
  const squad = squads.find((s) => s.id === client.squadId);
  const clientProject = projects.find((p) => p.clientId === client.id);
  const clientTasks = tasks.filter((t) => t.clientId === client.id);
  const doneTasks = clientTasks.filter((t) => t.status === 'done');
  const pendingTasks = clientTasks.filter((t) => t.status !== 'done');
  const sortedTasks = [...clientTasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: string, fieldLabel: string) => {
    if (editValue !== String((client as any)[field] ?? '')) {
      updateClientField(client.id, field, field === 'monthlyRevenue' ? Number(editValue) : editValue, fieldLabel);
    }
    setEditingField(null);
  };

  const cancelEdit = () => { setEditingField(null); setEditValue(''); };

  const handleSendNote = () => {
    if (!noteMessage.trim()) return;
    addChatNote(client.id, noteMessage.trim());
    setNoteMessage('');
  };

  const EditableField = ({ field, label, value, type = 'text' }: { field: string; label: string; value: string; type?: string }) => {
    const isEditing = editingField === field;
    return (
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            {field === 'startDate' ? (
              <Popover open={true} onOpenChange={(open) => { if (!open) cancelEdit(); }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 h-7 text-sm justify-start font-normal">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {editValue ? format(parseISO(editValue), "dd 'de' MMM yyyy", { locale: ptBR }) : 'Selecione...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={editValue ? parseISO(editValue) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formatted = format(date, 'yyyy-MM-dd');
                        setEditValue(formatted);
                        updateClientField(client.id, 'startDate', formatted, label);
                        setEditingField(null);
                      }
                    }}
                    initialFocus
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            ) : field === 'squadId' ? (
              <select
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="flex-1 text-sm bg-background border border-input rounded px-2 py-1 text-foreground"
              >
                {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : field === 'responsible' ? (
              <select
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="flex-1 text-sm bg-background border border-input rounded px-2 py-1 text-foreground"
              >
                <option value="">Selecione...</option>
                {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            ) : (
              <Input type={type} value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 text-sm flex-1" />
            )}
            {field !== 'startDate' && (
              <>
                <button onClick={() => saveEdit(field, label)} className="p-1 text-success hover:bg-success/10 rounded"><Save className="w-3.5 h-3.5" /></button>
                <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between group/edit">
            <p className="text-sm font-semibold text-foreground">{value}</p>
            <button onClick={() => startEdit(field, field === 'squadId' ? client.squadId : String((client as any)[field] ?? ''))} className="opacity-0 group-hover/edit:opacity-100 p-1 text-muted-foreground hover:text-primary rounded transition-opacity">
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-visible p-0">
        <div className="overflow-y-auto max-h-[85vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">{client.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{client.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge className={statusConf.className}>{statusConf.label}</StatusBadge>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {client.contractType === 'mrr' ? 'MRR' : `TCV ${client.contractDurationMonths}m`}
              </span>
              <button
                onClick={() => { setEditMode(true); setEditData({ name: client.name, companyName: client.companyName, segment: client.segment, status: client.status, platforms: client.platforms ?? (client.platform ? [client.platform] : []), contractType: client.contractType, paymentDay: client.paymentDay, contractDurationMonths: client.contractDurationMonths, notes: client.notes, monthlyRevenue: client.monthlyRevenue, responsible: client.responsible, setupFee: client.setupFee }); }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Editar cliente"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Apagar cliente">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza que deseja apagar este cliente?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os dados do cliente "{client.name}" serão removidos.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { deleteClient(client.id); onClose(); }}>Apagar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Edit Mode Form */}
          {editMode && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Cliente</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input value={editData.name ?? ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Empresa</Label>
                  <Input value={editData.companyName ?? ''} onChange={e => setEditData(p => ({ ...p, companyName: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Segmento</Label>
                  <Input value={editData.segment ?? ''} onChange={e => setEditData(p => ({ ...p, segment: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Responsável</Label>
                  <select value={editData.responsible ?? ''} onChange={e => setEditData(p => ({ ...p, responsible: e.target.value }))} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md text-foreground">
                    <option value="">Selecione...</option>
                    {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <select value={editData.status ?? 'active'} onChange={e => setEditData(p => ({ ...p, status: e.target.value as ClientStatus }))} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md text-foreground">
                    {clientStatuses.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Mensalidade (R$)</Label>
                  <Input type="number" value={editData.monthlyRevenue ?? ''} onChange={e => setEditData(p => ({ ...p, monthlyRevenue: Number(e.target.value) }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Setup Pago (R$)</Label>
                  <Input type="number" value={editData.setupFee ?? ''} onChange={e => setEditData(p => ({ ...p, setupFee: Number(e.target.value) }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Tipo de Contrato</Label>
                  <select value={editData.contractType ?? 'mrr'} onChange={e => setEditData(p => ({ ...p, contractType: e.target.value as ContractType }))} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md text-foreground">
                    <option value="mrr">MRR</option>
                    <option value="tcv">TCV</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Dia de Pagamento</Label>
                  <Input type="number" min={1} max={31} value={editData.paymentDay ?? 10} onChange={e => setEditData(p => ({ ...p, paymentDay: Number(e.target.value) }))} className="h-8 text-sm" />
                </div>
                {editData.contractType === 'tcv' && (
                  <div>
                    <Label className="text-xs">Duração (meses)</Label>
                    <Input type="number" value={editData.contractDurationMonths ?? 3} onChange={e => setEditData(p => ({ ...p, contractDurationMonths: Number(e.target.value) }))} className="h-8 text-sm" />
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs">Plataformas</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {platformOptions.map((plat) => {
                    const selected = (editData.platforms ?? []).includes(plat.slug);
                    return (
                      <button key={plat.id} type="button" onClick={() => setEditData(p => ({ ...p, platforms: selected ? (p.platforms ?? []).filter(x => x !== plat.slug) : [...(p.platforms ?? []), plat.slug] }))}
                        className={cn('px-3 py-1.5 text-xs rounded-lg border transition-all font-medium', selected ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30' : 'border-border bg-card text-muted-foreground hover:border-primary/40')}>
                        {plat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="text-xs">Observações</Label>
                <textarea value={editData.notes ?? ''} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} className="w-full h-20 px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground resize-none" />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={() => { updateClient(client.id, editData); setEditMode(false); }} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">Salvar</button>
              </div>
            </div>
          )}

          {/* Editable info grid */}
          {!editMode && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <EditableField field="startDate" label="Entrada" value={formatDate(client.startDate)} type="date" />
                <EditableField field="monthlyRevenue" label="Mensalidade" value={client.monthlyRevenue ? `R$ ${client.monthlyRevenue.toLocaleString('pt-BR')}` : '—'} type="number" />
                <EditableField field="squadId" label="Squad" value={squad?.name ?? '—'} />
                <EditableField field="responsible" label="Responsável" value={client.responsible || '—'} />
              </div>

              {/* Plataformas Operacionais */}
              {client.platforms && client.platforms.length > 0 && (
                <PlatformOperationalPanel
                  client={client}
                  platformOptions={platformOptions}
                  squads={squads}
                  appUsers={appUsers}
                  tasks={clientTasks}
                  clientStatuses={clientStatuses}
                />
              )}

              {/* Health color selector */}
              <div className="mt-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Saúde do Cliente</p>
                <div className="flex items-center gap-2">
                  {([
                    { value: 'green' as const, color: 'bg-success', label: 'Saudável' },
                    { value: 'yellow' as const, color: 'bg-warning', label: 'Atenção' },
                    { value: 'red' as const, color: 'bg-destructive', label: 'Crítico' },
                    { value: 'white' as const, color: 'bg-border', label: 'Não avaliado' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateClientField(client.id, 'healthColor', opt.value, 'Saúde do Cliente')}
                      title={opt.label}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        opt.color,
                        client.healthColor === opt.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-border hover:scale-105'
                      )}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Flows section */}
          {!editMode && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Fluxos</p>
              <div className="flex flex-wrap items-center gap-2">
                {(clientFlowsMap[client.id] ?? []).map((cf) => (
                  <span key={cf.flowId} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-medium">
                    <Workflow className="w-3 h-3" />
                    {cf.flowName}
                    <button
                      onClick={() => removeClientFlow.mutate({ clientId: client.id, flowId: cf.flowId })}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {showFlowSelect ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      className="h-7 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addClientFlow.mutate({ clientId: client.id, flowId: e.target.value });
                          setShowFlowSelect(false);
                        }
                      }}
                    >
                      <option value="" disabled>Selecionar fluxo...</option>
                      {allFlows
                        .filter(f => !(clientFlowsMap[client.id] ?? []).some(cf => cf.flowId === f.id))
                        .map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                    <button onClick={() => setShowFlowSelect(false)} className="p-1 text-muted-foreground hover:text-foreground rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFlowSelect(true)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/40 rounded-full px-2.5 py-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar
                  </button>
                )}
              </div>
            </div>
          )}


          <ContractSection client={client} updateClientField={updateClientField} />
        </div>

        {/* Stats bar */}
        <div className="px-6 py-3 flex items-center gap-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">Concluídas:</span>
            <span className="font-bold text-foreground">{doneTasks.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span className="text-muted-foreground">Pendentes:</span>
            <span className="font-bold text-foreground">{pendingTasks.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ClipboardList className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-foreground">{clientTasks.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm ml-auto">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Próx. pagamento</span>
            <span className="font-bold text-foreground">{nextPaymentDate}</span>
          </div>
        </div>

        {/* Project summary */}
        {clientProject && (
          <div className="px-6 py-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">DEMANDAS</h4>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{clientProject.name}</span>
                <span className="text-xs text-muted-foreground">{clientProject.progress}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${clientProject.progress}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Início: {formatDate(clientProject.startDate)}</span>
                <span>Prazo: {formatDate(clientProject.deadline)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="px-6 py-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Linha do tempo de demandas
          </h4>
          {sortedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma demanda registrada.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-4">
                {sortedTasks.map((task, index) => (
                  <TimelineItem key={task.id} task={task} isLast={index === sortedTasks.length - 1} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis */}
        <ClientAIAnalysis client={client} clientTasks={clientTasks} />

        {/* Chat-style Notes */}
        <div className="px-6 py-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Observações</h4>

          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
            {client.notes && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">{client.notes}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Nota inicial</p>
              </div>
            )}
            {client.chatNotes.map(note => (
              <div key={note.id} className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                <p className="text-sm text-foreground">{note.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{note.author}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={noteMessage}
              onChange={e => setNoteMessage(e.target.value)}
              placeholder="Escreva uma observação..."
              className="flex-1"
              onKeyDown={e => { if (e.key === 'Enter') handleSendNote(); }}
            />
            <button onClick={handleSendNote} disabled={!noteMessage.trim()} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Change Log */}
        <div className="px-6 py-4 border-t border-border">
          <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
            <History className="w-3.5 h-3.5" />
            Log de Alterações ({client.changeLogs.length})
          </button>

          {showLogs && client.changeLogs.length > 0 && (
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {[...client.changeLogs].reverse().map(log => (
                <div key={log.id} className="flex items-start gap-2 text-xs bg-muted/40 rounded-md p-2">
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{log.changedBy}</span>
                    <span className="text-muted-foreground"> alterou </span>
                    <span className="font-medium text-foreground">{log.field}</span>
                    <span className="text-muted-foreground"> de </span>
                    <span className="text-destructive line-through">{log.oldValue || '(vazio)'}</span>
                    <span className="text-muted-foreground"> para </span>
                    <span className="text-success">{log.newValue}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(log.changedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {showLogs && client.changeLogs.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">Nenhuma alteração registrada.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimelineItem({ task, isLast }: { task: Task; isLast: boolean }) {
  const statusConf = taskStatusConfig[task.status];
  const typesMap = useTaskTypesMap();
  const typeConf = taskTypeConfig[task.type] ?? typesMap[task.type] ?? { label: task.type, color: 'bg-muted text-muted-foreground' };
  const isDone = task.status === 'done';
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className="relative flex items-start gap-3 pl-0">
      <div className={cn('relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5', isDone ? 'bg-success text-success-foreground' : 'bg-card border-2 border-border')}>
        {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-2.5 h-2.5 text-muted-foreground" />}
      </div>
      <div className={cn('flex-1 bg-card rounded-lg border border-border p-3 transition-colors', isDone && 'opacity-75')}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={cn('text-sm font-medium', isDone ? 'text-muted-foreground line-through' : 'text-foreground')}>{task.title}</p>
          <StatusBadge className={statusConf.className}>{statusConf.label}</StatusBadge>
        </div>
        <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', typeConf.color)}>{typeConf.label}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Criada: {formatDate(task.createdAt)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Prazo: {formatDate(task.deadline)}</span>
          {task.realTime && <span>{task.realTime}h realizadas</span>}
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.responsible}</span>
        </div>
        {task.comments && <p className="text-xs text-muted-foreground mt-1.5 italic">{task.comments}</p>}
      </div>
    </div>
  );
}

function ContractSection({ client, updateClientField }: { client: Client; updateClientField: (id: string, field: string, value: any, label: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateClientField(client.id, 'contractFile', {
      name: file.name,
      url,
      uploadedAt: new Date().toISOString(),
    }, 'Contrato');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    updateClientField(client.id, 'contractFile', undefined, 'Contrato');
  };

  return (
    <div className="mt-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Contrato</p>
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleUpload} />

      {client.contractFile ? (
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{client.contractFile.name}</p>
            <p className="text-[10px] text-muted-foreground">
              Enviado em {new Date(client.contractFile.uploadedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <a
            href={client.contractFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 w-full bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Upload className="w-4 h-4" />
          Anexar contrato
        </button>
      )}
    </div>
  );
}
