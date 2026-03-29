import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientsQuery, useAddClientChatNote } from '@/hooks/useClientsQuery';
import { useTasksQuery, useAddTask } from '@/hooks/useTasksQuery';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { useCsJourneyItemsQuery, useUpdateJourneyItem, PHASE_LABELS } from '@/hooks/useCsJourneyQuery';
import { useSquadsQuery } from '@/hooks/useSquadsQuery';
import { useTaskStatusesQuery } from '@/hooks/useTaskStatusesQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Users, Heart, Send, Plus, Eye, CircleDot, Route } from 'lucide-react';
import { differenceInDays, format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Client, Task } from '@/types';

// --- Notification tracking ---
function useTaskNotificationsQuery() {
  return useQuery({
    queryKey: ['task_client_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('task_client_notifications' as any).select('*');
      if (error) throw error;
      return (data ?? []) as unknown as Array<{ id: string; task_id: string; notified_by: string; notified_at: string }>;
    },
  });
}

function useAddTaskNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, notifiedBy }: { taskId: string; notifiedBy: string }) => {
      const { error } = await supabase.from('task_client_notifications' as any).insert({ task_id: taskId, notified_by: notifiedBy } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_client_notifications'] }),
  });
}

// --- Helpers ---
function getDeadlineIndicator(deadline: string, status: string): { color: string; label: string; icon: string } {
  if (status === 'done' || status === 'concluida') return { color: 'text-blue-500', label: 'Entregue', icon: '🔵' };
  const d = parseISO(deadline);
  if (!isValid(d)) return { color: 'text-muted-foreground', label: 'Sem prazo', icon: '⚪' };
  const diff = differenceInDays(d, new Date());
  if (diff < 0) return { color: 'text-red-500', label: 'Atrasado', icon: '🔴' };
  if (diff <= 2) return { color: 'text-yellow-500', label: 'Atenção', icon: '🟡' };
  return { color: 'text-green-500', label: 'No prazo', icon: '🟢' };
}

function daysSince(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (!isValid(d)) return null;
  return differenceInDays(new Date(), d);
}

type TimeFilter = 'today' | 'this_week' | 'next_week';

export function CsDashboardPage() {
  const { currentUser } = useAuth();
  const { data: allClients = [] } = useClientsQuery();
  const { data: allTasks = [] } = useTasksQuery();
  const { data: allPlatforms = [] } = useClientPlatformsQuery();
  const { data: squads = [] } = useSquadsQuery();
  const { data: taskStatuses = [] } = useTaskStatusesQuery();
  const { data: notifications = [] } = useTaskNotificationsQuery();
  const addNotification = useAddTaskNotification();
  const addChatNote = useAddClientChatNote();
  const addTask = useAddTask();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('this_week');
  const [demandDialog, setDemandDialog] = useState(false);
  const [demandForm, setDemandForm] = useState({ clientId: '', platformId: '', description: '', priority: 'P2' as string, deadline: '' });

  const userName = currentUser?.name ?? '';

  // Filter clients by CS
  const myClients = useMemo(() =>
    allClients.filter(c => c.csResponsavel === userName),
    [allClients, userName]
  );
  const myClientIds = useMemo(() => new Set(myClients.map(c => c.id)), [myClients]);

  // Tasks for my clients
  const myTasks = useMemo(() =>
    allTasks.filter(t => myClientIds.has(t.clientId)),
    [allTasks, myClientIds]
  );

  // My own tasks (CS tasks)
  const myOwnTasks = useMemo(() =>
    allTasks.filter(t => t.responsible === userName),
    [allTasks, userName]
  );

  // Notification set
  const notifiedTaskIds = useMemo(() => new Set(notifications.map(n => n.task_id)), [notifications]);

  // Time filtered tasks
  const now = new Date();
  const filteredTasks = useMemo(() => {
    const pendingTasks = myTasks.filter(t => t.status !== 'done' && t.status !== 'concluida');
    if (timeFilter === 'today') {
      const todayStr = format(now, 'yyyy-MM-dd');
      return pendingTasks.filter(t => t.deadline <= todayStr);
    }
    if (timeFilter === 'this_week') {
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return pendingTasks.filter(t => {
        const d = parseISO(t.deadline);
        return isValid(d) && d <= end;
      });
    }
    // next_week
    const nextStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const nextEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    return pendingTasks.filter(t => {
      const d = parseISO(t.deadline);
      return isValid(d) && isWithinInterval(d, { start: nextStart, end: nextEnd });
    });
  }, [myTasks, timeFilter]);

  // Group tasks by client, sorted by urgency
  const tasksByClient = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      if (!map.has(t.clientId)) map.set(t.clientId, []);
      map.get(t.clientId)!.push(t);
    }
    // Sort clients by number of overdue tasks desc
    return Array.from(map.entries())
      .map(([clientId, tasks]) => {
        const client = myClients.find(c => c.id === clientId);
        const overdue = tasks.filter(t => differenceInDays(parseISO(t.deadline), now) < 0).length;
        return { clientId, client, tasks, overdue };
      })
      .sort((a, b) => b.overdue - a.overdue);
  }, [filteredTasks, myClients]);

  // Health metrics
  const healthMetrics = useMemo(() => {
    let emDia = 0, atencao = 0, critico = 0, semContato = 0;
    for (const c of myClients) {
      const clientTasks = myTasks.filter(t => t.clientId === c.id && t.status !== 'done' && t.status !== 'concluida');
      const overdue = clientTasks.filter(t => differenceInDays(parseISO(t.deadline), now) < 0).length;
      const ds = daysSince(c.ultimoContato);
      if (ds === null || ds > 3) semContato++;
      if (overdue >= 3 || c.healthColor === 'red') critico++;
      else if (overdue >= 1 || c.healthColor === 'yellow') atencao++;
      else emDia++;
    }
    return { total: myClients.length, emDia, atencao, critico, semContato };
  }, [myClients, myTasks]);

  // Handle notification toggle
  const handleNotify = (taskId: string) => {
    if (notifiedTaskIds.has(taskId)) return;
    addNotification.mutate({ taskId, notifiedBy: userName });
  };

  // Handle new demand for coordinator
  const handleCreateDemand = () => {
    const client = myClients.find(c => c.id === demandForm.clientId);
    if (!client) return;
    const squad = squads.find(s => s.id === client.squadId);
    const leader = squad?.leader ?? '';
    addTask.mutate({
      id: crypto.randomUUID(),
      title: demandForm.description.slice(0, 100),
      clientId: client.id,
      clientName: client.name,
      responsible: leader,
      type: 'solicitacao_cs',
      estimatedTime: 0,
      deadline: demandForm.deadline || format(now, 'yyyy-MM-dd'),
      status: 'backlog',
      priority: demandForm.priority === 'P1' ? 'high' : demandForm.priority === 'P4' ? 'low' : 'medium',
      comments: `[Solicitação CS - ${userName}] ${demandForm.description}`,
      createdAt: new Date().toISOString(),
      platformId: demandForm.platformId || undefined,
      origemTarefa: 'manual',
    } as Task);
    toast.success('Demanda enviada ao coordenador');
    setDemandDialog(false);
    setDemandForm({ clientId: '', platformId: '', description: '', priority: 'P2', deadline: '' });
  };

  // Kanban columns
  const sortedStatuses = useMemo(() =>
    [...taskStatuses].sort((a, b) => a.sort_order - b.sort_order),
    [taskStatuses]
  );

  const platformsForClient = (clientId: string) => allPlatforms.filter(p => p.clientId === clientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel CS</h1>
          <p className="text-sm text-muted-foreground">Carteira de {userName} · {myClients.length} clientes</p>
        </div>
        <Dialog open={demandDialog} onOpenChange={setDemandDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Nova demanda para coordenador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Demanda para Coordenador</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={demandForm.clientId} onValueChange={v => setDemandForm(f => ({ ...f, clientId: v, platformId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {myClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {demandForm.clientId && (
                <Select value={demandForm.platformId} onValueChange={v => setDemandForm(f => ({ ...f, platformId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Plataforma (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {platformsForClient(demandForm.clientId).map(p => <SelectItem key={p.id} value={p.id}>{p.platformSlug}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Textarea placeholder="Descreva o problema ou solicitação..." value={demandForm.description} onChange={e => setDemandForm(f => ({ ...f, description: e.target.value }))} />
              <div className="flex gap-3">
                <Select value={demandForm.priority} onValueChange={v => setDemandForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['P1', 'P2', 'P3', 'P4'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" className="flex-1" value={demandForm.deadline} onChange={e => setDemandForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreateDemand} disabled={!demandForm.clientId || !demandForm.description}>
                <Send className="w-4 h-4 mr-1.5" /> Enviar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agenda" className="gap-1.5"><Calendar className="w-3.5 h-3.5" /> Agenda</TabsTrigger>
          <TabsTrigger value="saude" className="gap-1.5"><Heart className="w-3.5 h-3.5" /> Saúde</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5"><CircleDot className="w-3.5 h-3.5" /> Minhas Tarefas</TabsTrigger>
          <TabsTrigger value="clientes" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Clientes</TabsTrigger>
          <TabsTrigger value="jornada" className="gap-1.5"><Route className="w-3.5 h-3.5" /> Jornada</TabsTrigger>
        </TabsList>

        {/* === SECTION 1: AGENDA === */}
        <TabsContent value="agenda" className="space-y-4">
          <div className="flex gap-2">
            {(['today', 'this_week', 'next_week'] as TimeFilter[]).map(f => (
              <Button key={f} variant={timeFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setTimeFilter(f)}>
                {f === 'today' ? 'Hoje' : f === 'this_week' ? 'Esta semana' : 'Próxima semana'}
              </Button>
            ))}
          </div>
          {tasksByClient.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum entregável pendente neste período.</CardContent></Card>
          )}
          {tasksByClient.map(({ clientId, client, tasks, overdue }) => (
            <Card key={clientId} className={overdue > 0 ? 'border-red-500/40' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{client?.name ?? clientId}</CardTitle>
                  {overdue > 0 && <Badge variant="destructive" className="text-xs">{overdue} atrasada(s)</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {tasks.sort((a, b) => a.deadline.localeCompare(b.deadline)).map(t => {
                  const ind = getDeadlineIndicator(t.deadline, t.status);
                  const isNotified = notifiedTaskIds.has(t.id);
                  return (
                    <div key={t.id} className="flex items-center gap-2 text-sm py-1 border-b border-border/50 last:border-0">
                      <span title={ind.label}>{ind.icon}</span>
                      <span className="flex-1 truncate">{t.title}</span>
                      <span className="text-xs text-muted-foreground">{t.deadline}</span>
                      <div className="flex items-center gap-1">
                        <Checkbox
                          checked={isNotified}
                          disabled={isNotified}
                          onCheckedChange={() => handleNotify(t.id)}
                          title="Comunicado ao cliente"
                        />
                        <span className="text-[10px] text-muted-foreground">Comunicado</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* === SECTION 2: HEALTH === */}
        <TabsContent value="saude" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: healthMetrics.total, className: 'bg-card' },
              { label: 'Em dia', value: healthMetrics.emDia, className: 'bg-green-500/10 text-green-500' },
              { label: 'Atenção', value: healthMetrics.atencao, className: 'bg-yellow-500/10 text-yellow-500' },
              { label: 'Críticos', value: healthMetrics.critico, className: 'bg-red-500/10 text-red-500' },
              { label: 'Sem contato', value: healthMetrics.semContato, className: 'bg-orange-500/10 text-orange-500' },
            ].map(m => (
              <Card key={m.label} className={m.className}>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-xs">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="divide-y divide-border">
              {myClients.map(c => {
                const clientTasks = myTasks.filter(t => t.clientId === c.id && t.status !== 'done' && t.status !== 'concluida');
                const overdue = clientTasks.filter(t => differenceInDays(parseISO(t.deadline), now) < 0).length;
                const ds = daysSince(c.ultimoContato);
                const healthIcon = overdue >= 3 || c.healthColor === 'red' ? '🔴' : overdue >= 1 || c.healthColor === 'yellow' ? '🟡' : '🟢';
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span>{healthIcon}</span>
                    <span className="flex-1 font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{clientTasks.length} pendentes</span>
                    {overdue > 0 && <Badge variant="destructive" className="text-[10px]">{overdue} atrasadas</Badge>}
                    {ds !== null && ds > 3 && (
                      <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-500">
                        <AlertTriangle className="w-3 h-3 mr-0.5" /> {ds}d sem contato
                      </Badge>
                    )}
                    {ds === null && (
                      <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-500">
                        Sem contato registrado
                      </Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === SECTION 3: KANBAN === */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedStatuses.map(col => {
              const colTasks = myOwnTasks.filter(t => t.status === col.key);
              return (
                <Card key={col.key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold flex items-center justify-between">
                      {col.label}
                      <Badge variant="secondary" className="text-[10px]">{colTasks.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {colTasks.map(t => {
                      const ind = getDeadlineIndicator(t.deadline, t.status);
                      return (
                        <div key={t.id} className="p-2 rounded-md border border-border bg-card text-xs space-y-1">
                          <p className="font-medium truncate">{t.title}</p>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>{t.clientName}</span>
                            <span className={ind.color}>{ind.icon} {t.deadline}</span>
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* === SECTION 5: CONSOLIDATED CLIENT INFO === */}
        <TabsContent value="clientes" className="space-y-2">
          <Accordion type="multiple">
            {myClients.map(c => {
              const cPlats = platformsForClient(c.id);
              const lastNotes = c.chatNotes?.slice(-5) ?? [];
              const ds = daysSince(c.ultimoContato);
              return (
                <AccordionItem key={c.id} value={c.id}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      {c.name}
                      {c.healthColor && (
                        <span className={`inline-block w-2 h-2 rounded-full ${c.healthColor === 'green' ? 'bg-green-500' : c.healthColor === 'yellow' ? 'bg-yellow-500' : c.healthColor === 'red' ? 'bg-red-500' : 'bg-gray-300'}`} />
                      )}
                      <Badge variant="outline" className="text-[10px]">{cPlats.length} plataformas</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    {/* Contract info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Mensalidade:</span> <span className="font-medium">R$ {c.monthlyRevenue?.toLocaleString('pt-BR') ?? '—'}</span></div>
                      <div><span className="text-muted-foreground">Contrato:</span> <span className="font-medium">{c.contractType?.toUpperCase()} · {c.contractDurationMonths ?? '—'} meses</span></div>
                      <div><span className="text-muted-foreground">Último contato:</span> <span className={`font-medium ${ds !== null && ds > 3 ? 'text-orange-500' : ''}`}>{c.ultimoContato ? `${c.ultimoContato} (${ds}d)` : 'Não registrado'}</span></div>
                      <div><span className="text-muted-foreground">NPS:</span> <span className="font-medium">{c.npsUltimo ?? '—'}</span></div>
                    </div>
                    {/* Platforms */}
                    {cPlats.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Plataformas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cPlats.map(p => (
                            <Badge key={p.id} variant="outline" className="text-[10px]">
                              {p.platformSlug} · {p.phase} · {p.platformStatus}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Last chat notes */}
                    {lastNotes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Últimas notas</p>
                        <div className="space-y-1">
                          {lastNotes.map(n => (
                            <div key={n.id} className="text-xs bg-muted/50 rounded px-2 py-1">
                              <span className="font-medium">{n.author}:</span> {n.message}
                              <span className="text-muted-foreground ml-1">({format(parseISO(n.createdAt), 'dd/MM', { locale: ptBR })})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* === SECTION: JORNADA === */}
        <TabsContent value="jornada" className="space-y-4">
          <JornadaSection clients={myClients} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JornadaSection({ clients }: { clients: Client[] }) {
  const { data: allItems = [] } = useCsJourneyItemsQuery();
  const updateItem = useUpdateJourneyItem();
  const { currentUser } = useAuth();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editLink, setEditLink] = useState('');
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  const clientJourneys = useMemo(() => {
    return clients.map(c => {
      const items = allItems.filter(i => i.clientId === c.id).sort((a, b) => a.dayNumber - b.dayNumber);
      const totalItems = items.length;
      const doneItems = items.filter(i => i.status === 'feita').length;
      const overdueItems = items.filter(i => i.status === 'pendente' && i.scheduledDate < todayStr);
      const startDate = parseISO(c.startDate);
      const daysCurrent = isValid(startDate) ? Math.max(0, differenceInDays(now, startDate)) : 0;
      const nextTask = items.find(i => i.status === 'pendente' && i.scheduledDate >= todayStr);
      return { client: c, items, totalItems, doneItems, overdueItems, daysCurrent, nextTask };
    }).filter(j => j.totalItems > 0).sort((a, b) => b.overdueItems.length - a.overdueItems.length);
  }, [clients, allItems, todayStr]);

  const handleComplete = (itemId: string) => {
    updateItem.mutate({
      id: itemId,
      updates: {
        status: 'feita',
        completedBy: currentUser?.name ?? '',
        completedAt: new Date().toISOString(),
        actualDate: todayStr,
      },
    });
  };

  const handleSkip = (itemId: string) => {
    updateItem.mutate({ id: itemId, updates: { status: 'pulada' } });
  };

  const handleSaveNotes = (itemId: string) => {
    updateItem.mutate({ id: itemId, updates: { notes: editNotes, link: editLink } }, {
      onSuccess: () => setEditingItem(null),
    });
  };

  if (clientJourneys.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma jornada encontrada para seus clientes.</p>;
  }

  return (
    <div className="space-y-3">
      {clientJourneys.map(({ client: c, items, totalItems, doneItems, overdueItems, daysCurrent, nextTask }) => {
        const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
        const isExpanded = expandedClient === c.id;

        return (
          <Card key={c.id} className="overflow-hidden">
            <button className="w-full text-left" onClick={() => setExpandedClient(isExpanded ? null : c.id)}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-sm font-semibold">{c.name}</CardTitle>
                    <Badge variant="outline" className="text-xs font-mono">D{daysCurrent} de 90</Badge>
                    {overdueItems.length > 0 && (
                      <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />{overdueItems.length} atrasada(s)</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-xs font-bold text-primary w-10 text-right">{pct}%</span>
                  </div>
                </div>
                {nextTask && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Próxima: <strong>D{nextTask.dayNumber}</strong> — {nextTask.title} ({nextTask.scheduledDate})
                  </p>
                )}
              </CardHeader>
            </button>

            {isExpanded && (
              <CardContent className="px-4 pb-4 pt-0">
                <div className="relative">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
                  <div className="space-y-2">
                    {items.map(item => {
                      const isOverdue = item.status === 'pendente' && item.scheduledDate < todayStr;
                      const isToday = item.scheduledDate === todayStr;
                      const isDone = item.status === 'feita';
                      const isSkipped = item.status === 'pulada';

                      return (
                        <div key={item.id} className="relative flex items-start gap-3 pl-0">
                          <div className={cn(
                            'relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                            isDone ? 'bg-green-500 text-white' :
                            isSkipped ? 'bg-muted text-muted-foreground' :
                            isOverdue ? 'bg-destructive text-destructive-foreground' :
                            isToday ? 'bg-yellow-500 text-white' :
                            'bg-card border-2 border-border'
                          )}>
                            {isDone ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[8px] font-bold">D{item.dayNumber}</span>}
                          </div>
                          <div className={cn(
                            'flex-1 rounded-lg border p-2.5 text-sm',
                            isDone ? 'bg-green-500/5 border-green-500/20 opacity-70' :
                            isOverdue ? 'bg-destructive/5 border-destructive/20' :
                            isToday ? 'bg-yellow-500/5 border-yellow-500/20' :
                            'bg-card border-border'
                          )}>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className={cn('font-medium', isDone && 'line-through text-muted-foreground')}>{item.title}</span>
                                <span className="text-xs text-muted-foreground ml-2">({PHASE_LABELS[item.phase]?.split(' ')[0] ?? item.phase})</span>
                                <span className="text-xs text-muted-foreground ml-2">{item.scheduledDate}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!isDone && !isSkipped && (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleComplete(item.id)}>
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> Feita
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => handleSkip(item.id)}>
                                      Pular
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm" variant="ghost" className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    if (editingItem === item.id) { setEditingItem(null); }
                                    else { setEditingItem(item.id); setEditNotes(item.notes); setEditLink(item.link); }
                                  }}
                                >
                                  {editingItem === item.id ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                                </Button>
                              </div>
                            </div>
                            {item.notes && editingItem !== item.id && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
                            )}
                            {item.link && editingItem !== item.id && (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-0.5 inline-block">🔗 Link</a>
                            )}
                            {editingItem === item.id && (
                              <div className="mt-2 space-y-1.5">
                                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Observações..." className="text-xs min-h-[50px]" />
                                <Input value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="Link (ex: gravação da reunião)" className="h-7 text-xs" />
                                <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveNotes(item.id)}>Salvar</Button>
                              </div>
                            )}
                            {isDone && item.completedBy && (
                              <p className="text-[10px] text-muted-foreground mt-1">✅ por {item.completedBy} em {item.actualDate}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
