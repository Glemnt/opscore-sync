import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSquads } from '@/contexts/SquadsContext';
import { useUpdateClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { toast } from 'sonner';
import { ArrowRightLeft } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  platformId: string;
  currentSquadId?: string | null;
  currentResponsible?: string;
}

export function TransferPlatformDialog({ open, onOpenChange, platformId, currentSquadId, currentResponsible }: Props) {
  const { squads } = useSquads();
  const updatePlatform = useUpdateClientPlatform();
  const [squadId, setSquadId] = useState(currentSquadId ?? '');
  const [responsible, setResponsible] = useState(currentResponsible ?? '');

  const selectedSquad = useMemo(() => squads.find((s) => s.id === squadId), [squads, squadId]);
  const members = selectedSquad?.members ?? [];

  const handleSave = () => {
    updatePlatform.mutate(
      { id: platformId, updates: { squadId: squadId || null, responsible } },
      {
        onSuccess: () => {
          toast.success('Plataforma transferida com sucesso!');
          onOpenChange(false);
        },
        onError: () => toast.error('Erro ao transferir'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Transferir Plataforma
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Squad destino</Label>
            <Select value={squadId} onValueChange={(v) => { setSquadId(v); setResponsible(''); }}>
              <SelectTrigger><SelectValue placeholder="Selecionar squad..." /></SelectTrigger>
              <SelectContent>
                {squads.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Responsável</Label>
            <Select value={responsible} onValueChange={setResponsible}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updatePlatform.isPending}>
            {updatePlatform.isPending ? 'Salvando...' : 'Transferir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
