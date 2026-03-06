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
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface EditPlatformDialogProps {
  open: boolean;
  onClose: () => void;
  platform: ClientPlatform;
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

export function EditPlatformDialog({ open, onClose, platform }: EditPlatformDialogProps) {
  const { data: appUsers = [] } = useAppUsersQuery();
  const updatePlatformMut = useUpdateClientPlatform();

  const [clientType, setClientType] = useState(platform.qualityLevel || 'Seller');
  const [responsible, setResponsible] = useState(platform.responsible || '');
  const [healthColor, setHealthColor] = useState(platform.healthColor || 'green');
  const [startDate, setStartDate] = useState<Date | undefined>(
    platform.startDate ? new Date(platform.startDate + 'T00:00:00') : undefined
  );
  const [origin, setOrigin] = useState(platform.origin || '');
  const [salesResponsible, setSalesResponsible] = useState(platform.salesResponsible || '');

  useEffect(() => {
    setClientType(platform.qualityLevel || 'Seller');
    setResponsible(platform.responsible || '');
    setHealthColor(platform.healthColor || 'green');
    setStartDate(platform.startDate ? new Date(platform.startDate + 'T00:00:00') : undefined);
    setOrigin(platform.origin || '');
    setSalesResponsible(platform.salesResponsible || '');
  }, [platform]);

  const handleSubmit = () => {
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
        onSuccess: () => {
          toast({ title: 'Plataforma atualizada com sucesso!' });
          onClose();
        },
        onError: () => {
          toast({ title: 'Erro ao atualizar plataforma', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Editar Plataforma — {platform.platformSlug}</DialogTitle>
        </DialogHeader>

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
            disabled={updatePlatformMut.isPending}
            className="w-full py-2 mt-2 gradient-primary text-primary-foreground rounded-lg text-sm font-medium shadow-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updatePlatformMut.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
