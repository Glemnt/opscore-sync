import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, CheckCircle2, Clock, ArrowUpCircle, Filter } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientsContext';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import {
  useActionPlansQuery, useAddActionPlan, useUpdateActionPlan, useDeleteActionPlan,
  CRISIS_TYPES, RESOLUTION_STATUSES, type ActionPlan
} from '@/hooks/useActionPlansQuery';

const statusColors: Record<string, string> = {
  aberto: 'bg-red-100 text-red-700',
  em_andamento: 'bg-amber-100 text-amber-700',
  escalado_diretoria: 'bg-purple-100 text-purple-700',
  resolvido: 'bg-emerald-100 text-emerald-700',
};

export function ActionPlansPage() {
  const { currentUser } = useAuth();
  const { clients } = useClients();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: plans = [], isLoading } = useActionPlansQuery();
  const addPlan = useAddActionPlan();
  const updatePlan = useUpdateActionPlan();
  const deletePlan = useDeleteActionPlan();

  const [openCreate, setOpenCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCrisis, setFilterCrisis] = useState('all');
  const [filterResponsible, setFilterResponsible] = useState('all');

  // Form state
  const [formClientId, setFormClientId] = useState('');
  const [formDaysDelayed, setFormDaysDelayed] = useState(0);
  const [formIssue, setFormIssue] = useState('');
  const [formCrisisType, setFormCrisisType] = useState('atraso_tarefa');
  const [formRootCause, setFormRootCause] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formActionText, setFormActionText] = useState('');
  const [formNewDeadline, setFormNewDeadline] = useState('');
  const [formManagerAware, setFormManagerAware] = useState(false);

  const resetForm = () => {
    setFormClientId(''); setFormDaysDelayed(0); setFormIssue(''); setFormCrisisType('atraso_tarefa');
    setFormRootCause(''); setFormResponsible(''); setFormActionText(''); setFormNewDeadline(''); setFormManagerAware(false);
  };

  const handleCreate = () => {
    if (!formClientId || !formIssue.trim()) { toast.error('Preencha cliente e descrição do problema'); return; }
    addPlan.mutate({
      clientId: formClientId,
      platformId: null,
      identifiedAt: new Date().toISOString().slice(0, 10),
      daysDelayed: formDaysDelayed,
      issueDescription: formIssue.trim(),
      crisisType: formCrisisType,
      rootCause: formRootCause.trim(),
      responsibleForDelay: formResponsible,
      actionPlanText: formActionText.trim(),
      newDeadline: formNewDeadline || null,
      resolutionStatus: 'aberto',
      managerAware: formManagerAware,
      createdBy: currentUser?.name ?? '',
    }, {
      onSuccess: () => { resetForm(); setOpenCreate(false); toast.success('Plano de ação criado'); },
      onError: (err: any) => toast.error(err.message || 'Erro ao criar'),
    });
  };

  const filtered = useMemo(() => {
    let result = plans;
    if (filterStatus !== 'all') result = result.filter(p => p.resolutionStatus === filterStatus);
    if (filterCrisis !== 'all') result = result.filter(p => p.crisisType === filterCrisis);
    if (filterResponsible !== 'all') result = result.filter(p => p.responsibleForDelay === filterResponsible);
    return result;
  }, [plans, filterStatus, filterCrisis, filterResponsible]);

  const counters = useMemo(() => ({
    aberto: plans.filter(p => p.resolutionStatus === 'aberto').length,
    em_andamento: plans.filter(p => p.resolutionStatus === 'em_andamento').length,
    escalado: plans.filter(p => p.resolutionStatus === 'escalado_diretoria').length,
    resolvido: plans.filter(p => p.resolutionStatus === 'resolvido').length,
  }), [plans]);

  const responsibleOptions = useMemo(() => {
    const set = new Set(plans.map(p => p.responsibleForDelay).filter(Boolean));
    return Array.from(set).sort();
  }, [plans]);

  const handleInlineUpdate = (id: string, field: keyof ActionPlan, value: any) => {
    updatePlan.mutate({ id, updates: { [field]: value } as any });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Plano de Ação" subtitle="Registro e acompanhamento de crises e atrasos" />
        <Button onClick={() => setOpenCreate(true)} className="gradient-primary shadow-primary">
          <Plus className="w-4 h-4 mr-2" /> Novo Plano
        </Button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Abertos', value: counters.aberto, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Em andamento', value: counters.em_andamento, icon: Clock, color: 'text-warning' },
          { label: 'Escalados', value: counters.escalado, icon: ArrowUpCircle, color: 'text-purple-500' },
          { label: 'Resolvidos', value: counters.resolvido, icon: CheckCircle2, color: 'text-success' },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <c.icon className={cn('w-5 h-5', c.color)} />
            <div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {RESOLUTION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCrisis} onValueChange={setFilterCrisis}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Tipo de crise" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {CRISIS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterResponsible} onValueChange={setFilterResponsible}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {responsibleOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm-custom overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Problema</TableHead>
                <TableHead>Tipo Crise</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum plano de ação encontrado</TableCell>
                </TableRow>
              ) : (
                filtered.map(plan => {
                  const crisisLabel = CRISIS_TYPES.find(t => t.value === plan.crisisType)?.label ?? plan.crisisType;
                  const statusLabel = RESOLUTION_STATUSES.find(s => s.value === plan.resolutionStatus)?.label ?? plan.resolutionStatus;
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium text-sm max-w-[140px] truncate">{plan.clientName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{plan.identifiedAt}</TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-bold', plan.daysDelayed > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                          {plan.daysDelayed}d
                        </span>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={plan.issueDescription}>{plan.issueDescription}</TableCell>
                      <TableCell>
                        <Select value={plan.crisisType} onValueChange={v => handleInlineUpdate(plan.id, 'crisisType', v)}>
                          <SelectTrigger className="h-7 text-xs w-[140px] border-0 bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CRISIS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">{plan.responsibleForDelay}</TableCell>
                      <TableCell>
                        <Select value={plan.resolutionStatus} onValueChange={v => handleInlineUpdate(plan.id, 'resolutionStatus', v)}>
                          <SelectTrigger className={cn('h-7 text-xs w-[130px] border-0 font-medium', statusColors[plan.resolutionStatus] ?? 'bg-muted')}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RESOLUTION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={plan.managerAware}
                          onCheckedChange={v => handleInlineUpdate(plan.id, 'managerAware', v)}
                          className="scale-75"
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setDeletingId(plan.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Plano de Ação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={formClientId} onValueChange={setFormClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Dias em Atraso</Label>
                <Input type="number" value={formDaysDelayed} onChange={e => setFormDaysDelayed(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Crise</Label>
                <Select value={formCrisisType} onValueChange={setFormCrisisType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CRISIS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição do Problema</Label>
              <Textarea value={formIssue} onChange={e => setFormIssue(e.target.value)} placeholder="Descreva o problema..." />
            </div>
            <div className="space-y-2">
              <Label>Causa Raiz</Label>
              <Textarea value={formRootCause} onChange={e => setFormRootCause(e.target.value)} placeholder="O que causou o problema..." />
            </div>
            <div className="space-y-2">
              <Label>Responsável pelo Atraso</Label>
              <Select value={formResponsible} onValueChange={setFormResponsible}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {appUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plano de Ação</Label>
              <Textarea value={formActionText} onChange={e => setFormActionText(e.target.value)} placeholder="O que será feito..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Novo Prazo</Label>
                <Input type="date" value={formNewDeadline} onChange={e => setFormNewDeadline(e.target.value)} />
              </div>
              <div className="space-y-2 flex items-end gap-2">
                <Label>Manager Ciente?</Label>
                <Switch checked={formManagerAware} onCheckedChange={setFormManagerAware} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpenCreate(false); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={addPlan.isPending} className="gradient-primary shadow-primary">
              {addPlan.isPending ? 'Criando...' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={open => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano de ação</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) deletePlan.mutate(deletingId, { onSuccess: () => { setDeletingId(null); toast.success('Plano removido'); } }); }}
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
