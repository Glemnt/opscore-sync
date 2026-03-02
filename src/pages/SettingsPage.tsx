import { useState } from 'react';
import { Plus, Shield, ShieldCheck, ShieldAlert, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSquads } from '@/contexts/SquadsContext';
import { useAppUsersQuery, useCreateAppUser, useUpdateAppUser, useDeleteAppUser } from '@/hooks/useAppUsersQuery';
import { usePlatformsQuery, useAddPlatform, useDeletePlatform } from '@/hooks/usePlatformsQuery';
import { useTaskTypesQuery, useAddTaskType, useDeleteTaskType } from '@/hooks/useTaskTypesQuery';
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
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const roleLabels: Record<TeamRole, string> = {
  cs: 'CS',
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

  // Create dialog
  const [openCreate, setOpenCreate] = useState(false);
  // Edit dialog
  const [editingUser, setEditingUser] = useState<AppUserProfile | null>(null);
  // Delete confirm
  const [deletingUser, setDeletingUser] = useState<AppUserProfile | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<TeamRole>('operacional');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(1);
  const [selectedSquads, setSelectedSquads] = useState<string[]>([]);

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setRole('operacional'); setAccessLevel(1); setSelectedSquads([]);
  };

  const openEditDialog = (u: AppUserProfile) => {
    setEditingUser(u);
    setName(u.name);
    setRole(u.role);
    setAccessLevel(u.accessLevel);
    setSelectedSquads(u.squadIds);
  };

  const handleCreate = () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    createUser.mutate(
      { name: name.trim(), email: email.trim(), password: password.trim(), role, accessLevel, squadIds: accessLevel === 3 ? squads.map((s) => s.id) : selectedSquads },
      { onSuccess: () => { resetForm(); setOpenCreate(false); } }
    );
  };

  const handleUpdate = () => {
    if (!editingUser || !name.trim()) return;
    updateUser.mutate(
      { userId: editingUser.id, name: name.trim(), role, accessLevel, squadIds: accessLevel === 3 ? squads.map((s) => s.id) : selectedSquads },
      { onSuccess: () => { setEditingUser(null); resetForm(); } }
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

  // Shared form fields (used in create and edit dialogs)
  const renderFormFields = (isEdit: boolean) => (
    <div className="space-y-4">
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
                    <TableCell className="text-muted-foreground">{roleLabels[u.role]}</TableCell>
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
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-md">
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
        <DialogContent className="max-w-md">
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
