import { useState, useEffect } from 'react';
import { Plus, Shield, ShieldCheck, ShieldAlert, Pencil, Trash2, CalendarIcon, Cake, Route, Save, X, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSquads } from '@/contexts/SquadsContext';
import { useAppUsersQuery, useCreateAppUser, useUpdateAppUser, useDeleteAppUser } from '@/hooks/useAppUsersQuery';
import { useUserGoalsQuery, useUpsertUserGoal } from '@/hooks/useUserGoalsQuery';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { usePlatformsQuery, useAddPlatform, useDeletePlatform } from '@/hooks/usePlatformsQuery';
import { useTaskTypesQuery, useAddTaskType, useDeleteTaskType } from '@/hooks/useTaskTypesQuery';
import { useDelayReasonsQuery, useAddDelayReason, useUpdateDelayReason, useDeleteDelayReason } from '@/hooks/useDelayReasonsQuery';
import { useCsJourneyTemplatesQuery, useAddJourneyTemplate, useUpdateJourneyTemplate, useDeleteJourneyTemplate, PHASE_LABELS, PHASE_OPTIONS } from '@/hooks/useCsJourneyQuery';
import { AccessLevel, TeamRole } from '@/types';
import type { AppUserProfile } from '@/types/database';
import { PageHeader } from '@/components/ui/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Only the official Grupo TG roles appear in the dropdown
const roleLabels: Record<string, string> = {
  auxiliar_ecommerce: 'AUXILIAR DE ECOMMERCE',
  assistente_ecommerce: 'ASSISTENTE DE ECOMMERCE',
  manager: 'MANAGER',
  head: 'HEAD',
  cs: 'CS',
  coo: 'COO',
  ceo: 'CEO',
};

// All roles including legacy ones for display in table
const allRoleLabels: Record<string, string> = {
  ...roleLabels,
  operacional: 'Operacional',
  design: 'Design',
  copy: 'Copy',
  gestao: 'Gestão',
};

const levelLabels: Record<AccessLevel, { label: string; icon: typeof Shield }> = {
  1: { label: 'Operacional', icon: Shield },
  2: { label: 'Supervisor', icon: ShieldCheck },
  3: { label: 'Administrador', icon: ShieldAlert },
};

function calculateAge(birthday: string | null): number | null {
  if (!birthday) return null;
  try {
    return differenceInYears(new Date(), parseISO(birthday));
  } catch {
    return null;
  }
}

function JornadaCsSettings() {
  const { data: templates = [], isLoading } = useCsJourneyTemplatesQuery();
  const addTemplate = useAddJourneyTemplate();
  const updateTemplate = useUpdateJourneyTemplate();
  const deleteTemplate = useDeleteJourneyTemplate();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState(1);
  const [newPhase, setNewPhase] = useState('onboard');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDay, setEditDay] = useState(1);
  const [editPhase, setEditPhase] = useState('onboard');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTemplate.mutate({ title: newTitle.trim(), dayNumber: newDay, phase: newPhase }, {
      onSuccess: () => { setNewTitle(''); setNewDay(1); setNewPhase('onboard'); setShowAdd(false); toast.success('Template adicionado'); },
    });
  };

  const startEdit = (t: any) => {
    setEditingId(t.id); setEditTitle(t.title); setEditDay(t.dayNumber); setEditPhase(t.phase);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateTemplate.mutate({ id: editingId, updates: { title: editTitle, dayNumber: editDay, phase: editPhase } }, {
      onSuccess: () => { setEditingId(null); toast.success('Template atualizado'); },
    });
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Route className="w-5 h-5" /> Jornada do CS (D1-D90)
      </h3>
      <div className="bg-card rounded-xl border border-border shadow-sm-custom p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">Template de tarefas automáticas ao longo dos 90 dias do cliente.</p>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1"><Plus className="w-4 h-4" /> Adicionar</Button>
        </div>

        {showAdd && (
          <div className="flex items-end gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <Label className="text-xs">Título</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título da tarefa" className="h-8 text-sm" />
            </div>
            <div className="w-20">
              <Label className="text-xs">Dia</Label>
              <Input type="number" min={1} max={90} value={newDay} onChange={e => setNewDay(Number(e.target.value))} className="h-8 text-sm" />
            </div>
            <div className="w-44">
              <Label className="text-xs">Fase</Label>
              <select value={newPhase} onChange={e => setNewPhase(e.target.value)} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md text-foreground">
                {PHASE_OPTIONS.map(p => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
              </select>
            </div>
            <Button size="sm" onClick={handleAdd} disabled={addTemplate.isPending}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum template cadastrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Dia</TableHead>
                <TableHead className="w-40">Fase</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="w-20 text-center">Ativo</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id}>
                  {editingId === t.id ? (
                    <>
                      <TableCell><Input type="number" min={1} max={90} value={editDay} onChange={e => setEditDay(Number(e.target.value))} className="h-7 w-14 text-sm" /></TableCell>
                      <TableCell>
                        <select value={editPhase} onChange={e => setEditPhase(e.target.value)} className="h-7 px-1 text-xs bg-background border border-input rounded text-foreground">
                          {PHASE_OPTIONS.map(p => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
                        </select>
                      </TableCell>
                      <TableCell><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-7 text-sm" /></TableCell>
                      <TableCell />
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-7 px-2"><Save className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2"><X className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-mono text-sm font-bold">D{t.dayNumber}</TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{PHASE_LABELS[t.phase] ?? t.phase}</span></TableCell>
                      <TableCell className="text-sm">{t.title}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => updateTemplate.mutate({ id: t.id, updates: { isActive: !t.isActive } })}
                          className={cn('w-4 h-4 rounded-full border-2 inline-block', t.isActive ? 'bg-green-500 border-green-600' : 'bg-muted border-border')}
                          title={t.isActive ? 'Desativar' : 'Ativar'}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <button onClick={() => startEdit(t)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5 inline" /></button>
                        <button onClick={() => deleteTemplate.mutate(t.id, { onSuccess: () => toast.success('Template removido') })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5 inline" /></button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { currentUser } = useAuth();
  const { squads } = useSquads();
  const { data: users = [], isLoading } = useAppUsersQuery();
  const createUser = useCreateAppUser();
  const updateUser = useUpdateAppUser();
  const deleteUser = useDeleteAppUser();
  const { data: platforms = [], isLoading: platformsLoading } = usePlatformsQuery();
  const addPlatform = useAddPlatform();
  const deletePlatform = useDeletePlatform();
  const [newPlatformName, setNewPlatformName] = useState('');

  const { data: taskTypes = [], isLoading: taskTypesLoading } = useTaskTypesQuery();
  const addTaskType = useAddTaskType();
  const deleteTaskType = useDeleteTaskType();
  const [newTaskTypeLabel, setNewTaskTypeLabel] = useState('');

  const { data: delayReasons = [], isLoading: delayReasonsLoading } = useDelayReasonsQuery();
  const addDelayReason = useAddDelayReason();
  const updateDelayReason = useUpdateDelayReason();
  const deleteDelayReason = useDeleteDelayReason();
  const [newDelayReasonLabel, setNewDelayReasonLabel] = useState('');

  // Create dialog
  const [openCreate, setOpenCreate] = useState(false);
  // Edit dialog
  const [editingUser, setEditingUser] = useState<AppUserProfile | null>(null);
  // Delete confirm
  const [deletingUser, setDeletingUser] = useState<AppUserProfile | null>(null);

  // Goals state
  const [goalPassagens, setGoalPassagens] = useState(5);
  const [goalDestravamentos, setGoalDestravamentos] = useState(3);
  const [goalReducaoBacklog, setGoalReducaoBacklog] = useState(5);
  const [goalAnunciosDia, setGoalAnunciosDia] = useState(24);
  const [goalAnunciosCliente, setGoalAnunciosCliente] = useState(75);

  const { data: allGoals = [] } = useUserGoalsQuery();
  const upsertGoal = useUpsertUserGoal();
  const { data: clientPlatforms = [] } = useClientPlatformsQuery();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<TeamRole>('auxiliar_ecommerce');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(1);
  const [selectedSquads, setSelectedSquads] = useState<string[]>([]);
  const [hireDate, setHireDate] = useState<Date | undefined>(undefined);
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setRole('auxiliar_ecommerce'); setAccessLevel(1); setSelectedSquads([]);
    setHireDate(undefined); setBirthday(undefined);
  };

  const openEditDialog = (u: AppUserProfile) => {
    setEditingUser(u);
    setName(u.name);
    setRole(u.role);
    setAccessLevel(u.accessLevel);
    setSelectedSquads(u.squadIds);
    setHireDate(u.hireDate ? parseISO(u.hireDate) : undefined);
    setBirthday(u.birthday ? parseISO(u.birthday) : undefined);
    // Load goals
    const userGoal = allGoals.find(g => g.userId === u.id && g.period === 'weekly');
    setGoalPassagens(userGoal?.metaPassagens ?? 5);
    setGoalDestravamentos(userGoal?.metaDestravamentos ?? 3);
    setGoalReducaoBacklog(userGoal?.metaReducaoBacklog ?? 5);
    setGoalAnunciosDia(userGoal?.metaAnunciosDia ?? 24);
    setGoalAnunciosCliente(userGoal?.metaAnunciosCliente ?? 75);
  };

  const handleCreate = () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    createUser.mutate(
      {
        name: name.trim(), email: email.trim(), password: password.trim(), role, accessLevel,
        squadIds: accessLevel === 3 ? squads.map((s) => s.id) : selectedSquads,
        hireDate: hireDate ? format(hireDate, 'yyyy-MM-dd') : null,
        birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
      },
      { onSuccess: () => { resetForm(); setOpenCreate(false); } }
    );
  };

  const handleUpdate = () => {
    if (!editingUser || !name.trim()) return;
    updateUser.mutate(
      {
        userId: editingUser.id, name: name.trim(), role, accessLevel,
        squadIds: accessLevel === 3 ? squads.map((s) => s.id) : selectedSquads,
        hireDate: hireDate ? format(hireDate, 'yyyy-MM-dd') : null,
        birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
      },
      {
        onSuccess: () => {
          // Save goals
          upsertGoal.mutate({
            userId: editingUser.id,
            period: 'weekly',
            metaPassagens: goalPassagens,
            metaDestravamentos: goalDestravamentos,
            metaReducaoBacklog: goalReducaoBacklog,
            metaAnunciosDia: goalAnunciosDia,
            metaAnunciosCliente: goalAnunciosCliente,
            createdBy: currentUser?.name || '',
          });
          setEditingUser(null); resetForm();
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUser.mutate(deletingUser.id, { onSuccess: () => setDeletingUser(null) });
  };

  const toggleSquad = (id: string) => {
    setSelectedSquads((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const isSelf = (u: AppUserProfile) => currentUser?.authUserId === u.authUserId;

  const computedAge = birthday ? differenceInYears(new Date(), birthday) : null;

  // Shared form fields (used in create and edit dialogs)
  const renderFormFields = (isEdit: boolean) => (
    <div className="space-y-5">
      {/* Section: Dados Principais */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-1.5">Dados Principais</h4>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select value={String(accessLevel)} onValueChange={(v) => setAccessLevel(Number(v) as AccessLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Operacional</SelectItem>
                  <SelectItem value="2">2 — Supervisor</SelectItem>
                  <SelectItem value="3">3 — Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {accessLevel !== 3 && (
            <div className="space-y-2">
              <Label>Squads vinculados</Label>
              <div className="flex flex-wrap gap-2">
                {squads.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSquad(s.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      selectedSquads.includes(s.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section: Dados do Colaborador */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-1.5">Dados do Colaborador</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Data de Entrada</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !hireDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {hireDate ? format(hireDate, 'dd/MM/yyyy') : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={hireDate}
                  onSelect={setHireDate}
                  locale={ptBR}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Data de Aniversário</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !birthday && 'text-muted-foreground')}
                >
                  <Cake className="mr-2 h-4 w-4" />
                  {birthday ? format(birthday, 'dd/MM/yyyy') : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthday}
                  onSelect={setBirthday}
                  locale={ptBR}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1950}
                  toYear={new Date().getFullYear()}
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {computedAge !== null && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Cake className="w-4 h-4" />
            <span>Idade: <strong className="text-foreground">{computedAge} anos</strong></span>
          </div>
        )}
      </div>

      {/* Section: Metas */}
      {isEdit && editingUser && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-1.5 flex items-center gap-2">
            <Target className="w-4 h-4" /> Metas do Colaborador
          </h4>
          {/* Auto-calculated readonly fields */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Plataformas sob responsabilidade</span>
              <p className="text-lg font-bold text-foreground">{clientPlatforms.filter(p => p.responsible === editingUser.name).length}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Plataformas em atraso</span>
              <p className="text-lg font-bold text-destructive">
                {clientPlatforms.filter(p => p.responsible === editingUser.name && p.deadline && new Date(p.deadline) < new Date() && !['performance', 'escala', 'done'].includes(p.phase)).length}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Meta semanal de passagens</Label>
              <Input type="number" min={0} value={goalPassagens} onChange={e => setGoalPassagens(Number(e.target.value))} className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Meta diária destravamentos</Label>
              <Input type="number" min={0} value={goalDestravamentos} onChange={e => setGoalDestravamentos(Number(e.target.value))} className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Meta redução backlog</Label>
              <Input type="number" min={0} value={goalReducaoBacklog} onChange={e => setGoalReducaoBacklog(Number(e.target.value))} className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Meta anúncios/dia</Label>
              <Input type="number" min={0} value={goalAnunciosDia} onChange={e => setGoalAnunciosDia(Number(e.target.value))} className="h-8 text-sm" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-xs">Meta anúncios/cliente (plataforma)</Label>
              <Input type="number" min={0} value={goalAnunciosCliente} onChange={e => setGoalAnunciosCliente(Number(e.target.value))} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Configurações"
        subtitle="Gerencie os usuários do sistema"
        actions={
          <Button onClick={() => { resetForm(); setOpenCreate(true); }} className="gradient-primary shadow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm-custom overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Squads</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const lvl = levelLabels[u.accessLevel];
                const LvlIcon = lvl.icon;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.login}</TableCell>
                    <TableCell className="text-muted-foreground">{allRoleLabels[u.role] ?? u.role}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <LvlIcon className="w-4 h-4 text-primary" />
                        {lvl.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {u.accessLevel === 3
                        ? 'Todos'
                        : u.squadIds.map((sid) => squads.find((s) => s.id === sid)?.name).filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingUser(u)}
                          disabled={isSelf(u)}
                          title={isSelf(u) ? 'Não é possível excluir a si mesmo' : 'Excluir'}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Platforms Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Plataformas</h3>
        <div className="bg-card rounded-xl border border-border shadow-sm-custom p-5">
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={newPlatformName}
              onChange={(e) => setNewPlatformName(e.target.value)}
              placeholder="Nome da nova plataforma"
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = newPlatformName.trim();
                  if (!name) return;
                  const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                  addPlatform.mutate({ name, slug }, {
                    onSuccess: () => { setNewPlatformName(''); toast.success('Plataforma adicionada'); },
                    onError: (err: any) => toast.error(err.message || 'Erro ao adicionar'),
                  });
                }
              }}
            />
            <Button
              onClick={() => {
                const name = newPlatformName.trim();
                if (!name) return;
                const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                addPlatform.mutate({ name, slug }, {
                  onSuccess: () => { setNewPlatformName(''); toast.success('Plataforma adicionada'); },
                  onError: (err: any) => toast.error(err.message || 'Erro ao adicionar'),
                });
              }}
              disabled={!newPlatformName.trim() || addPlatform.isPending}
              className="gradient-primary shadow-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {platformsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-28" />)
            ) : platforms.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma plataforma cadastrada</p>
            ) : (
              platforms.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-sm font-medium text-foreground">
                  {p.name}
                  <button
                    onClick={() => deletePlatform.mutate(p.id, { onSuccess: () => toast.success('Plataforma removida') })}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remover plataforma"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
      </div>

      {/* Task Types Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Tipos de Demanda</h3>
        <div className="bg-card rounded-xl border border-border shadow-sm-custom p-5">
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={newTaskTypeLabel}
              onChange={(e) => setNewTaskTypeLabel(e.target.value)}
              placeholder="Nome do novo tipo"
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const label = newTaskTypeLabel.trim();
                  if (!label) return;
                  const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                  addTaskType.mutate({ key, label, color: 'bg-gray-100 text-gray-700' }, {
                    onSuccess: () => { setNewTaskTypeLabel(''); toast.success('Tipo adicionado'); },
                    onError: (err: any) => toast.error(err.message || 'Erro ao adicionar'),
                  });
                }
              }}
            />
            <Button
              onClick={() => {
                const label = newTaskTypeLabel.trim();
                if (!label) return;
                const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                addTaskType.mutate({ key, label, color: 'bg-gray-100 text-gray-700' }, {
                  onSuccess: () => { setNewTaskTypeLabel(''); toast.success('Tipo adicionado'); },
                  onError: (err: any) => toast.error(err.message || 'Erro ao adicionar'),
                });
              }}
              disabled={!newTaskTypeLabel.trim() || addTaskType.isPending}
              className="gradient-primary shadow-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {taskTypesLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-28" />)
            ) : taskTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum tipo cadastrado</p>
            ) : (
              taskTypes.map((t) => (
                <div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-sm font-medium text-foreground">
                  {t.label}
                  <button
                    onClick={() => deleteTaskType.mutate(t.id, { onSuccess: () => toast.success('Tipo removido') })}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remover tipo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delay Reasons Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Motivos de Atraso</h3>
        <div className="bg-card rounded-xl border border-border shadow-sm-custom p-5">
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={newDelayReasonLabel}
              onChange={(e) => setNewDelayReasonLabel(e.target.value)}
              placeholder="Nome do novo motivo"
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const label = newDelayReasonLabel.trim();
                  if (!label) return;
                  addDelayReason.mutate({ label, sortOrder: delayReasons.length + 1 }, {
                    onSuccess: () => { setNewDelayReasonLabel(''); toast.success('Motivo adicionado'); },
                    onError: (err: any) => toast.error(err.message || 'Erro ao adicionar'),
                  });
                }
              }}
            />
            <Button
              onClick={() => {
                const label = newDelayReasonLabel.trim();
                if (!label) return;
                addDelayReason.mutate({ label, sortOrder: delayReasons.length + 1 }, {
                  onSuccess: () => { setNewDelayReasonLabel(''); toast.success('Motivo adicionado'); },
                  onError: (err: any) => toast.error(err.message || 'Erro ao adicionar'),
                });
              }}
              disabled={!newDelayReasonLabel.trim() || addDelayReason.isPending}
              className="gradient-primary shadow-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {delayReasonsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-36" />)
            ) : delayReasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum motivo cadastrado</p>
            ) : (
              delayReasons.map((r) => (
                <div key={r.id} className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium',
                  r.isActive ? 'border-border bg-muted/50 text-foreground' : 'border-border/50 bg-muted/20 text-muted-foreground line-through'
                )}>
                  <button
                    onClick={() => updateDelayReason.mutate({ id: r.id, updates: { is_active: !r.isActive } }, {
                      onSuccess: () => toast.success(r.isActive ? 'Motivo desativado' : 'Motivo ativado'),
                    })}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title={r.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {r.isActive ? '●' : '○'}
                  </button>
                  {r.label}
                  <button
                    onClick={() => deleteDelayReason.mutate(r.id, { onSuccess: () => toast.success('Motivo removido') })}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remover motivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Jornada CS Section */}
      <JornadaCsSettings />
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          {renderFormFields(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpenCreate(false); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createUser.isPending} className="gradient-primary shadow-primary">
              {createUser.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) { setEditingUser(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {renderFormFields(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingUser(null); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={updateUser.isPending} className="gradient-primary shadow-primary">
              {updateUser.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => { if (!open) setDeletingUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingUser?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteUser.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
