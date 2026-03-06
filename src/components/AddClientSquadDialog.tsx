import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSquads } from '@/contexts/SquadsContext';
import { useClients } from '@/contexts/ClientsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Client, Platform } from '@/types';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useAddClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AddClientSquadDialogProps {
  open: boolean;
  onClose: () => void;
  defaultSquadId: string;
}

const ORIGIN_OPTIONS = [
  { value: 'trafego', label: 'Tráfego' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'organico', label: 'Orgânico' },
  { value: 'outro', label: 'Outro' },
];

const REVENUE_OPTIONS = [
  { value: 'ate-30k', label: 'Até 30k', amount: 30000 },
  { value: '30k-100k', label: '30k - 100k', amount: 100000 },
  { value: '100k-plus', label: '100k+', amount: 150000 },
];

const CLIENT_TYPE_OPTIONS = [
  { value: 'Seller', label: 'Seller' },
  { value: 'Lojista', label: 'Lojista' },
];

const HEALTH_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'green', label: '🟢 Saudável', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700' },
  { value: 'yellow', label: '🟠 Atenção', color: 'border-amber-500 bg-amber-500/10 text-amber-700' },
  { value: 'red', label: '🔴 Crítico', color: 'border-red-500 bg-red-500/10 text-red-700' },
];

export function AddClientSquadDialog({ open, onClose, defaultSquadId }: AddClientSquadDialogProps) {
  const { addClient } = useClients();
  const { currentUser } = useAuth();
  const { squads } = useSquads();
  const { data: platformOptions = [] } = usePlatformsQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const addClientPlatformMut = useAddClientPlatform();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segment, setSegment] = useState('');
  const [clientType, setClientType] = useState('Seller');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [origin, setOrigin] = useState('');
  const [responsible, setResponsible] = useState('');
  const [contractDuration, setContractDuration] = useState('6');
  const [healthColor, setHealthColor] = useState('green');
  const [revenueTier, setRevenueTier] = useState('ate-30k');

  const resetForm = () => {
    setName(''); setCompanyName(''); setCnpj(''); setSegment('');
    setClientType('Seller'); setPhone(''); setEmail('');
    setPlatforms([]); setOrigin(''); setResponsible('');
    setContractDuration('6'); setHealthColor('green'); setRevenueTier('ate-30k');
  };

  const handleSubmit = () => {
    if (!name.trim() || !companyName.trim()) return;

    const clientId = crypto.randomUUID();
    const revenueAmount = REVENUE_OPTIONS.find(r => r.value === revenueTier)?.amount ?? 0;

    const newClient: Client = {
      id: clientId,
      name: name.trim(),
      companyName: companyName.trim(),
      segment: segment.trim() || 'Geral',
      responsible,
      squadId: defaultSquadId,
      startDate: new Date().toISOString().split('T')[0],
      status: 'onboarding',
      notes: '',
      monthlyRevenue: revenueAmount,
      activeProjects: 0,
      pendingTasks: 0,
      contractType: 'mrr',
      paymentDay: 1,
      contractDurationMonths: Number(contractDuration),
      platforms,
      phone: phone.trim() || undefined,
      cnpj: cnpj.trim() || undefined,
      email: email.trim() || undefined,
      origin: origin || undefined,
      changeLogs: [],
      chatNotes: [],
    };

    addClient(newClient, {
      onSuccess: () => {
        // Create client_platforms with quality_level and health_color
        platforms.forEach(slug => {
          addClientPlatformMut.mutate({
            clientId,
            platformSlug: slug,
            phase: 'onboarding',
            squadId: defaultSquadId,
            qualityLevel: clientType,
            healthColor,
          });
        });
        toast({ title: 'Cliente criado com sucesso!' });
        resetForm();
        onClose();
      },
      onError: () => {
        toast({ title: 'Erro ao criar cliente', description: 'Tente novamente.', variant: 'destructive' });
      },
    });
  };

  const selectedSquad = squads.find(s => s.id === defaultSquadId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Novo Cliente — {selectedSquad?.name ?? 'Squad'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Nome do Cliente */}
          <div>
            <Label className="text-xs">Nome do Cliente</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" className="h-8 text-sm" />
          </div>

          {/* Nome da Empresa */}
          <div>
            <Label className="text-xs">Nome da Empresa</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Empresa XYZ LTDA" className="h-8 text-sm" />
          </div>

          {/* CNPJ + Nicho */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">CNPJ</Label>
              <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Nicho do Cliente</Label>
              <Input value={segment} onChange={e => setSegment(e.target.value)} placeholder="Moda, Eletrônicos..." className="h-8 text-sm" />
            </div>
          </div>

          {/* Tipo de Cliente */}
          <div>
            <Label className="text-xs">Tipo de Cliente</Label>
            <div className="flex gap-2 mt-1.5">
              {CLIENT_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setClientType(opt.value)}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs rounded-lg border transition-all font-medium',
                    clientType === opt.value
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Telefone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@empresa.com" className="h-8 text-sm" />
            </div>
          </div>

          {/* Plataformas */}
          <div>
            <Label className="text-xs">Plataforma</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {platformOptions.map((plat) => {
                const selected = platforms.includes(plat.slug);
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setPlatforms(prev => selected ? prev.filter(p => p !== plat.slug) : [...prev, plat.slug])}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg border transition-all font-medium',
                      selected
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {plat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Origem */}
          <div>
            <Label className="text-xs">Origem</Label>
            <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
              <option value="">Selecione...</option>
              {ORIGIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Responsável + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Responsável pelo Onboarding</Label>
              <select value={responsible} onChange={e => setResponsible(e.target.value)} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                <option value="">Selecione...</option>
                {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Time Responsável</Label>
              <select value={defaultSquadId} disabled className="w-full h-8 px-2 text-sm bg-muted border border-input rounded-md text-muted-foreground cursor-not-allowed">
                {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Tempo de Contrato */}
          <div>
            <Label className="text-xs">Tempo de Contrato</Label>
            <select value={contractDuration} onChange={e => setContractDuration(e.target.value)} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
            </select>
          </div>

          {/* Saúde da Plataforma */}
          <div>
            <Label className="text-xs">Saúde da Plataforma</Label>
            <div className="flex gap-2 mt-1.5">
              {HEALTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHealthColor(opt.value)}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs rounded-lg border transition-all font-medium',
                    healthColor === opt.value
                      ? opt.color + ' ring-1'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Faturamento do Cliente */}
          <div>
            <Label className="text-xs">Faturamento do Cliente</Label>
            <div className="flex gap-2 mt-1.5">
              {REVENUE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRevenueTier(opt.value)}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs rounded-lg border transition-all font-medium',
                    revenueTier === opt.value
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !companyName.trim()}
            className="w-full py-2 mt-2 gradient-primary text-primary-foreground rounded-lg text-sm font-medium shadow-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar Cliente
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
