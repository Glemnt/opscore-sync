import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useUpdateClientPlatform, ClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { useClientsQuery, useUpdateClient } from '@/hooks/useClientsQuery';
import { useClientStatusesQuery } from '@/hooks/useClientStatusesQuery';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useSquads } from '@/contexts/SquadsContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';


interface EditPlatformDialogProps {
  open: boolean;
  onClose: () => void;
  platform: ClientPlatform;
}

const HEALTH_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'green', label: '🟢 Saudável', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700' },
  { value: 'yellow', label: '🟠 Atenção', color: 'border-amber-500 bg-amber-500/10 text-amber-700' },
  { value: 'red', label: '🔴 Crítico', color: 'border-red-500 bg-red-500/10 text-red-700' },
];

const CLIENT_TYPE_OPTIONS = [
  { value: 'Seller', label: 'Seller' },
  { value: 'Lojista', label: 'Lojista' },
];

export function EditPlatformDialog({ open, onClose, platform }: EditPlatformDialogProps) {
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: clients = [] } = useClientsQuery();
  const { data: clientStatuses = [] } = useClientStatusesQuery('clients');
  const { data: platformOptions = [] } = usePlatformsQuery();
  const { squads } = useSquads();
  const updatePlatformMut = useUpdateClientPlatform();
  const updateClientMut = useUpdateClient();

  const client = clients.find(c => c.id === platform.clientId);

  // Platform fields
  const [clientType, setClientType] = useState(platform.qualityLevel || 'Seller');
  const [responsible, setResponsible] = useState(platform.responsible || '');
  const [healthColor, setHealthColor] = useState(platform.healthColor || 'green');
  const [startDate, setStartDate] = useState<Date | undefined>(
    platform.startDate ? new Date(platform.startDate + 'T00:00:00') : undefined
  );
  const [origin, setOrigin] = useState(platform.origin || '');
  const [salesResponsible, setSalesResponsible] = useState(platform.salesResponsible || '');

  // Client fields
  const [companyName, setCompanyName] = useState('');
  const [segment, setSegment] = useState('');
  const [clientResponsible, setClientResponsible] = useState('');
  const [status, setStatus] = useState('active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contractDuration, setContractDuration] = useState<number>(6);
  const [squadId, setSquadId] = useState('');
  const [clientStartDate, setClientStartDate] = useState('');
  const [clientHealthColor, setClientHealthColor] = useState('white');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Platform
    setClientType(platform.qualityLevel || 'Seller');
    setResponsible(platform.responsible || '');
    setHealthColor(platform.healthColor || 'green');
    setStartDate(platform.startDate ? new Date(platform.startDate + 'T00:00:00') : undefined);
    setOrigin(platform.origin || '');
    setSalesResponsible(platform.salesResponsible || '');
    // Client
    if (client) {
      setName(client.name || '');
      setCompanyName(client.companyName || '');
      setSegment(client.segment || '');
      setClientResponsible(client.responsible || '');
      setStatus(client.status || 'active');
      setMonthlyRevenue(client.monthlyRevenue ?? '');
      setSetupFee(client.setupFee ?? '');
      setCnpj(client.cnpj || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setContractType(client.contractType || 'mrr');
      setPaymentDay(client.paymentDay ?? 1);
      setContractDuration(client.contractDurationMonths ?? 6);
      setSquadId(client.squadId || '');
      setClientStartDate(client.startDate || '');
      setClientHealthColor(client.healthColor ?? 'white');
      setPlatforms(client.platforms ?? []);
      setNotes(client.notes || '');
    }
  }, [platform, client]);

  const handleSubmit = () => {
    // Update platform
    updatePlatformMut.mutate(
      {
        id: platform.id,
        updates: {
          qualityLevel: clientType,
          responsible,
          healthColor,
          startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          origin,
          salesResponsible,
        },
      },
      {
        onError: () => toast({ title: 'Erro ao atualizar plataforma', variant: 'destructive' }),
      }
    );

    // Update client
    if (client) {
      updateClientMut.mutate(
        {
          id: client.id,
          updates: {
            name,
            companyName,
            segment,
            responsible: clientResponsible,
            status,
            monthlyRevenue: monthlyRevenue === '' ? null : Number(monthlyRevenue),
            setupFee: setupFee === '' ? null : Number(setupFee),
            cnpj,
            phone,
            email,
            contractType,
            paymentDay,
            contractDurationMonths: contractDuration,
            squadId: squadId || null,
            startDate: clientStartDate,
            healthColor: clientHealthColor,
            platforms,
            notes,
          },
        },
        {
          onSuccess: () => {
            toast({ title: 'Dados atualizados com sucesso!' });
            onClose();
          },
          onError: () => toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' }),
        }
      );
    } else {
      toast({ title: 'Plataforma atualizada com sucesso!' });
      onClose();
    }
  };

  const selectClass = "w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Editar — {platform.platformSlug}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ─── Dados do Cliente ─── */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dados do Cliente</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Empresa</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Segmento</Label>
                <Input value={segment} onChange={e => setSegment(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Responsável</Label>
                <select value={clientResponsible} onChange={e => setClientResponsible(e.target.value)} className={selectClass}>
                  <option value="">Selecione...</option>
                  {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
                  {clientStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Mensalidade (R$)</Label>
                <Input type="number" value={monthlyRevenue} onChange={e => setMonthlyRevenue(e.target.value === '' ? '' : Number(e.target.value))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Setup Pago (R$)</Label>
                <Input type="number" value={setupFee} onChange={e => setSetupFee(e.target.value === '' ? '' : Number(e.target.value))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">CNPJ</Label>
                <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@empresa.com" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tipo de Contrato</Label>
                <select value={contractType} onChange={e => setContractType(e.target.value as ContractType)} className={selectClass}>
                  <option value="mrr">MRR</option>
                  <option value="tcv">TCV</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Dia de Pagamento</Label>
                <Input type="number" min={1} max={31} value={paymentDay} onChange={e => setPaymentDay(Number(e.target.value))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Duração do Contrato</Label>
                <select value={contractDuration} onChange={e => setContractDuration(Number(e.target.value))} className={selectClass}>
                  <option value={6}>6 meses</option>
                  <option value={12}>12 meses</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Squad</Label>
                <select value={squadId} onChange={e => setSquadId(e.target.value)} className={selectClass}>
                  <option value="">—</option>
                  {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Data de Entrada</Label>
                <Input type="date" value={clientStartDate} onChange={e => setClientStartDate(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Saúde do Cliente</Label>
                <select value={clientHealthColor} onChange={e => setClientHealthColor(e.target.value)} className={selectClass}>
                  <option value="green">🟢 Saudável</option>
                  <option value="yellow">🟡 Atenção</option>
                  <option value="red">🔴 Crítico</option>
                  <option value="white">⚪ Não avaliado</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">Plataformas</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {platformOptions.map(plat => {
                  const selected = platforms.includes(plat.slug);
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => setPlatforms(prev => selected ? prev.filter(x => x !== plat.slug) : [...prev, plat.slug])}
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
            <div className="mt-3">
              <Label className="text-xs">Observações</Label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-20 px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground resize-none"
              />
            </div>
          </div>

          {/* ─── Dados da Plataforma ─── */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dados da Plataforma</h4>
            <div className="space-y-3">
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

              <div>
                <Label className="text-xs">Data de Onboarding</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'w-full h-8 px-2 text-sm bg-background border border-input rounded-md flex items-center justify-between text-foreground',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-xs">Origem</Label>
                <Input
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  placeholder="Ex: Indicação, Google Ads..."
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Responsável pelo Onboarding</Label>
                  <select value={responsible} onChange={e => setResponsible(e.target.value)} className={selectClass}>
                    <option value="">Selecione...</option>
                    {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Vendedor Responsável</Label>
                  <select value={salesResponsible} onChange={e => setSalesResponsible(e.target.value)} className={selectClass}>
                    <option value="">Selecione...</option>
                    {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>

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
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={updatePlatformMut.isPending || updateClientMut.isPending}
            className="w-full py-2 mt-2 gradient-primary text-primary-foreground rounded-lg text-sm font-medium shadow-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(updatePlatformMut.isPending || updateClientMut.isPending) ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
