import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useSquads } from '@/contexts/SquadsContext';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useAddClientPlatform, useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useClientsQuery } from '@/hooks/useClientsQuery';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AddPlatformSquadDialogProps {
  open: boolean;
  onClose: () => void;
  defaultSquadId: string;
}

const CLIENT_TYPE_OPTIONS = [
  { value: 'Seller', label: 'Seller' },
  { value: 'Lojista', label: 'Lojista' },
];

const HEALTH_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'green', label: '🟢 Saudável', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700' },
  { value: 'yellow', label: '🟠 Atenção', color: 'border-amber-500 bg-amber-500/10 text-amber-700' },
  { value: 'red', label: '🔴 Crítico', color: 'border-red-500 bg-red-500/10 text-red-700' },
];

const REVENUE_TIER_OPTIONS = [
  { value: 'ate-30k', label: 'Até 30k' },
  { value: '30k-100k', label: '30k - 100k' },
  { value: '100k-plus', label: '100k +' },
];

export function AddPlatformSquadDialog({ open, onClose, defaultSquadId }: AddPlatformSquadDialogProps) {
  const { squads } = useSquads();
  const { data: platformOptions = [] } = usePlatformsQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: clients = [] } = useClientsQuery();
  const { data: clientPlatformsData = [] } = useClientPlatformsQuery();
  const addClientPlatformMut = useAddClientPlatform();

  const [clientId, setClientId] = useState('');
  const [platformSlug, setPlatformSlug] = useState('');
  const [clientType, setClientType] = useState('Seller');
  const [responsible, setResponsible] = useState('');
  const [healthColor, setHealthColor] = useState('green');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [origin, setOrigin] = useState('');
  const [revenueTier, setRevenueTier] = useState('ate-30k');
  const [salesResponsible, setSalesResponsible] = useState('');

  const resetForm = () => {
    setClientId('');
    setPlatformSlug('');
    setClientType('Seller');
    setResponsible('');
    setHealthColor('green');
    setStartDate(new Date());
    setOrigin('');
    setRevenueTier('ate-30k');
    setSalesResponsible('');
  };

  const existingPlatformSlugs = clientPlatformsData
    .filter(cp => cp.clientId === clientId)
    .map(cp => cp.platformSlug);

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setPlatformSlug('');
  };

  const handleSubmit = () => {
    if (!clientId || !platformSlug) return;

    addClientPlatformMut.mutate(
      {
        clientId,
        platformSlug,
        phase: 'onboarding',
        squadId: defaultSquadId,
        qualityLevel: clientType,
        healthColor,
        responsible,
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        origin,
        revenueTier,
        salesResponsible,
      },
      {
        onSuccess: () => {
          toast({ title: 'Plataforma adicionada com sucesso!' });
          resetForm();
          onClose();
        },
        onError: (err: any) => {
          const msg = err?.message || '';
          const isDuplicate = /duplicate|unique|already exists/i.test(msg);
          toast({
            title: isDuplicate ? 'Este cliente já possui essa plataforma' : 'Erro ao criar plataforma',
            description: isDuplicate ? 'Selecione outra plataforma ou outro cliente.' : 'Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const selectedSquad = squads.find(s => s.id === defaultSquadId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Nova Plataforma — {selectedSquad?.name ?? 'Squad'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Cliente</Label>
            <select
              value={clientId}
              onChange={e => handleClientChange(e.target.value)}
              className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs">Plataforma</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {platformOptions.map((plat) => {
                const alreadyAdded = existingPlatformSlugs.includes(plat.slug);
                return (
                  <button
                    key={plat.id}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => !alreadyAdded && setPlatformSlug(plat.slug)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg border transition-all font-medium',
                      alreadyAdded
                        ? 'border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                        : platformSlug === plat.slug
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {plat.name}{alreadyAdded ? ' (já adicionada)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

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
              <select
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">Selecione...</option>
                {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Vendedor Responsável</Label>
              <select
                value={salesResponsible}
                onChange={e => setSalesResponsible(e.target.value)}
                className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="">Selecione...</option>
                {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Time Responsável</Label>
              <select
                value={defaultSquadId}
                disabled
                className="w-full h-8 px-2 text-sm bg-muted border border-input rounded-md text-muted-foreground cursor-not-allowed"
              >
                {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Faturamento</Label>
            <div className="flex gap-2 mt-1.5">
              {REVENUE_TIER_OPTIONS.map(opt => (
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

          <button
            onClick={handleSubmit}
            disabled={!clientId || !platformSlug || addClientPlatformMut.isPending}
            className="w-full py-2 mt-2 gradient-primary text-primary-foreground rounded-lg text-sm font-medium shadow-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar Plataforma
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
