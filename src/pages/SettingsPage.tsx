import { useState } from 'react';
import { Plus, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { squads } from '@/data/mockData';
import { AppUser, AccessLevel, TeamRole } from '@/types';
import { PageHeader } from '@/components/ui/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
  const { users, addUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<TeamRole>('operacional');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(1);
  const [selectedSquads, setSelectedSquads] = useState<string[]>([]);

  const resetForm = () => {
    setName(''); setLogin(''); setPassword(''); setRole('operacional'); setAccessLevel(1); setSelectedSquads([]);
  };

  const handleSubmit = () => {
    if (!name.trim() || !login.trim() || !password.trim()) return;
    const newUser: AppUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      login: login.trim(),
      password,
      role,
      accessLevel,
      squadIds: accessLevel === 3 ? squads.map((s) => s.id) : selectedSquads,
    };
    addUser(newUser);
    resetForm();
    setOpen(false);
  };

  const toggleSquad = (id: string) => {
    setSelectedSquads((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Configurações"
        subtitle="Gerencie os usuários do sistema"
        actions={
          <Button onClick={() => setOpen(true)} className="gradient-primary shadow-primary">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Login</Label>
                <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
              </div>
            </div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancelar</Button>
            <Button onClick={handleSubmit} className="gradient-primary shadow-primary">Criar Usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
