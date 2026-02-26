import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/contexts/TasksContext';
import { useSquads } from '@/contexts/SquadsContext';
import { projects as allProjects } from '@/data/mockData';
import { taskTypeConfig, priorityConfig } from '@/lib/config';
import { Task, TaskType, Priority } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { getVisibleClients } = useAuth();
  const { addTask } = useTasks();
  const { squads } = useSquads();
  const visibleClients = getVisibleClients();

  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState<TaskType>('anuncio');
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState<Date>();
  const [responsible, setResponsible] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [comments, setComments] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const selectedClient = visibleClients.find((c) => c.id === clientId);

  const generateTitle = (cId: string, t: TaskType) => {
    const client = visibleClients.find((c) => c.id === cId);
    if (client) return `${taskTypeConfig[t].label} - ${client.name}`;
    return '';
  };

  const handleClientChange = (v: string) => {
    setClientId(v);
    setProjectId('');
    setResponsible('');
    setTitle(generateTitle(v, type));
  };

  const handleTypeChange = (v: TaskType) => {
    setType(v);
    setTitle(generateTitle(clientId, v));
  };

  const clientProjects = useMemo(
    () => (clientId ? allProjects.filter((p) => p.clientId === clientId) : []),
    [clientId]
  );

  const squadMembers = useMemo(() => {
    if (!selectedClient) return [];
    const squad = squads.find((s) => s.id === selectedClient.squadId);
    return squad?.members ?? [];
  }, [selectedClient, squads]);

  const resetForm = () => {
    setClientId('');
    setProjectId('');
    setType('anuncio');
    setTitle('');
    setDeadline(undefined);
    setResponsible('');
    setPriority('medium');
    setEstimatedTime('');
    setComments('');
    setSubtaskInput('');
    setSubtasks([]);
  };

  const handleSubmit = () => {
    if (!clientId || !title || !deadline || !responsible) {
      toast({ title: 'Preencha os campos obrigatórios', description: 'Cliente, nome, prazo e responsável são obrigatórios.', variant: 'destructive' });
      return;
    }

    const client = visibleClients.find((c) => c.id === clientId)!;
    const project = clientProjects.find((p) => p.id === projectId);

    const newTask: Task = {
      id: `t_${Date.now()}`,
      title,
      clientId,
      clientName: client.name,
      projectId: project?.id,
      projectName: project?.name,
      responsible,
      type,
      estimatedTime: parseFloat(estimatedTime) || 0,
      deadline: deadline.toISOString().split('T')[0],
      status: 'backlog',
      priority,
      comments,
      createdAt: new Date().toISOString().split('T')[0],
      subtasks: subtasks.map((label, i) => ({
        id: `st_${Date.now()}_${i}`,
        label,
        done: false,
      })),
    };

    addTask(newTask);
    toast({ title: 'Demanda criada!', description: `"${title}" adicionada ao Backlog.` });
    resetForm();
    onOpenChange(false);
  };

  const addSubtask = () => {
    const trimmed = subtaskInput.trim();
    if (trimmed) {
      setSubtasks((prev) => [...prev, trimmed]);
      setSubtaskInput('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {visibleClients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projeto vinculado */}
          <div className="space-y-1.5">
            <Label>Projeto vinculado</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={!clientId}>
              <SelectTrigger><SelectValue placeholder="(Opcional)" /></SelectTrigger>
              <SelectContent>
                {clientProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de demanda */}
          <div className="space-y-1.5">
            <Label>Tipo de demanda *</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as TaskType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(taskTypeConfig).map(([key, conf]) => (
                  <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([key, conf]) => (
                  <SelectItem key={key} value={key}>{conf.icon} {conf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome da demanda (auto-preenchido) */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome da demanda *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Criar anúncios para campanha de verão" />
          </div>

          {/* Prazo */}
          <div className="space-y-1.5">
            <Label>Prazo *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !deadline && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, 'dd/MM/yyyy') : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <Label>Responsável *</Label>
            <Select value={responsible} onValueChange={setResponsible} disabled={!clientId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {squadMembers.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tempo estimado */}
          <div className="space-y-1.5">
            <Label>Tempo estimado (horas)</Label>
            <Input type="number" min="0" step="0.5" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="Ex: 3" />
          </div>

          {/* Observação */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observação</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Notas adicionais sobre a demanda..." rows={3} />
          </div>

          {/* Subtarefas */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Subtarefas iniciais</Label>
            <div className="flex gap-2">
              <Input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                placeholder="Nome da subtarefa"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSubtask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {subtasks.length > 0 && (
              <ul className="space-y-1 mt-2">
                {subtasks.map((st, i) => (
                  <li key={i} className="flex items-center justify-between text-sm bg-muted rounded-md px-3 py-1.5">
                    <span>{st}</span>
                    <button onClick={() => setSubtasks((prev) => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">Criar Demanda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
