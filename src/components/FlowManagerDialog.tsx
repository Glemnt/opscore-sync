import { useState } from 'react';
import { Plus, X, GripVertical, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/contexts/TasksContext';
import { useAddFlow } from '@/hooks/useFlowsQuery';
import { useAddClientFlow } from '@/hooks/useClientFlowsQuery';
import { useClients } from '@/contexts/ClientsContext';
import { toast } from 'sonner';

export type FlowDialogMode = 'create' | 'edit' | 'assign';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FlowDialogMode;
}

export function FlowManagerDialog({ open, onOpenChange, mode }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {mode === 'create' && <CreateFlowView onClose={() => onOpenChange(false)} />}
        {mode === 'edit' && <EditFlowView onClose={() => onOpenChange(false)} />}
        {mode === 'assign' && <AssignFlowView onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CreateFlowView({ onClose }: { onClose: () => void }) {
  const { flows } = useTasks();
  const addFlowMut = useAddFlow();
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);

  const handleAddStep = () => setSteps((s) => [...s, '']);
  const handleRemoveStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const handleStepChange = (i: number, v: string) => setSteps((s) => s.map((x, idx) => (idx === i ? v : x)));

  const handleSave = async () => {
    const trimmedName = name.trim();
    const validSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (!trimmedName) { toast.error('Informe o nome do fluxo'); return; }
    if (validSteps.length === 0) { toast.error('Adicione pelo menos uma etapa'); return; }
    try {
      await addFlowMut.mutateAsync({ name: trimmedName, steps: validSteps, createdAt: new Date().toISOString() } as any);
      toast.success('Fluxo criado!');
      onClose();
    } catch { toast.error('Erro ao criar fluxo'); }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Criar Fluxo</DialogTitle>
        <DialogDescription>Defina o nome e as etapas do fluxo de trabalho.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <div className="space-y-1.5">
          <Label>Nome do fluxo *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Onboarding de cliente" />
        </div>
        <div className="space-y-2">
          <Label>Etapas</Label>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={step}
                onChange={(e) => handleStepChange(i, e.target.value)}
                placeholder={`Etapa ${i + 1}`}
              />
              {steps.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={handleAddStep} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Adicionar etapa
          </Button>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Fluxo</Button>
        </div>
      </div>
    </>
  );
}

function EditFlowView({ onClose }: { onClose: () => void }) {
  const { flows, updateFlow, deleteFlow } = useTasks();
  const [selectedId, setSelectedId] = useState('');
  const selected = flows.find((f) => f.id === selectedId);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<string[]>([]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const f = flows.find((fl) => fl.id === id);
    if (f) { setName(f.name); setSteps([...f.steps]); }
  };

  const handleStepChange = (i: number, v: string) => setSteps((s) => s.map((x, idx) => (idx === i ? v : x)));
  const handleAddStep = () => setSteps((s) => [...s, '']);
  const handleRemoveStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const validSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || validSteps.length === 0) { toast.error('Preencha nome e etapas'); return; }
    updateFlow(selectedId, { name: name.trim(), steps: validSteps });
    toast.success('Fluxo atualizado!');
    onClose();
  };

  const handleDelete = () => {
    deleteFlow(selectedId);
    toast.success('Fluxo excluído');
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar Fluxo</DialogTitle>
        <DialogDescription>Selecione um fluxo existente para editar ou excluir.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <Select value={selectedId} onValueChange={handleSelect}>
          <SelectTrigger><SelectValue placeholder="Selecione um fluxo" /></SelectTrigger>
          <SelectContent>
            {flows.length === 0 && <SelectItem value="__none__" disabled>Nenhum fluxo criado</SelectItem>}
            {flows.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {selected && (
          <>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Etapas</Label>
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input value={step} onChange={(e) => handleStepChange(i, e.target.value)} />
                  {steps.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddStep} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar etapa
              </Button>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function AssignFlowView({ onClose }: { onClose: () => void }) {
  const { flows, assignFlowToClient } = useTasks();
  const { getVisibleClients } = useClients();
  const clients = getVisibleClients();
  const [clientId, setClientId] = useState('');
  const [flowId, setFlowId] = useState('');

  const handleAssign = () => {
    if (!clientId || !flowId) { toast.error('Selecione cliente e fluxo'); return; }
    try {
      assignFlowToClient(clientId, flowId);
      toast.success('Fluxo atribuído ao cliente!');
      onClose();
    } catch { toast.error('Erro ao atribuir fluxo'); }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Atribuir Fluxo ao Cliente</DialogTitle>
        <DialogDescription>Vincule um fluxo existente a um cliente. As etapas serão criadas como demandas.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <div className="space-y-1.5">
          <Label>Cliente *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
            <SelectContent>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fluxo *</Label>
          <Select value={flowId} onValueChange={setFlowId}>
            <SelectTrigger><SelectValue placeholder="Selecione o fluxo" /></SelectTrigger>
            <SelectContent>
              {flows.length === 0 && <SelectItem value="__none__" disabled>Nenhum fluxo criado</SelectItem>}
              {flows.map((f) => <SelectItem key={f.id} value={f.id}>{f.name} ({f.steps.length} etapas)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAssign}>Atribuir</Button>
        </div>
      </div>
    </>
  );
}
