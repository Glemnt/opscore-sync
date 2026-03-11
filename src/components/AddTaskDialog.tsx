import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { useTasks } from '@/contexts/TasksContext';
import { useClients } from '@/contexts/ClientsContext';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';

import { priorityConfig } from '@/lib/config';
import { useTaskTypesQuery, useAddTaskType } from '@/hooks/useTaskTypesQuery';
import { Task, TaskType, TaskStatus, Priority } from '@/types';
import { cn, hoursToHM, hmToHours } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: TaskStatus;
  defaultClientId?: string;
  defaultClientName?: string;
  defaultPlatformSlug?: string;
}

export function AddTaskDialog({ open, onOpenChange, defaultStatus = 'backlog', defaultClientId, defaultClientName, defaultPlatformSlug }: AddTaskDialogProps) {
  const { addTask } = useTasks();
  const { getVisibleClients } = useClients();
  const { data: appUsers = [] } = useAppUsersQuery();
  const { data: platforms = [] } = usePlatformsQuery();
  const visibleClients = getVisibleClients();
  const { data: taskTypes = [] } = useTaskTypesQuery();
  const addTaskTypeMut = useAddTaskType();
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);

  const [clientId, setClientId] = useState(defaultClientId ?? '');
  
  const [type, setType] = useState<TaskType>('anuncio');
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState<Date>();
  const [responsible, setResponsible] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estH, setEstH] = useState(0);
  const [estM, setEstM] = useState(0);
  const [comments, setComments] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(defaultPlatformSlug ? [defaultPlatformSlug] : []);

  const selectedClient = visibleClients.find((c) => c.id === clientId);

  const allTypes = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {};
    for (const t of taskTypes) map[t.key] = { label: t.label, color: t.color };
    return map;
  }, [taskTypes]);

  const generateTitle = (cId: string, t: TaskType) => {
    const client = visibleClients.find((c) => c.id === cId);
    const typeLabel = allTypes[t]?.label ?? t;
    if (client) return `${typeLabel} - ${client.name}`;
    return '';
  };

  const handleClientChange = (v: string) => {
    setClientId(v);
    setResponsible('');
    setTitle(generateTitle(v, type));
  };

  const handleTypeChange = (v: TaskType) => {
    setType(v);
    setTitle(generateTitle(clientId, v));
  };

  const handleAddCustomType = () => {
    const trimmed = newTypeLabel.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase().replace(/\s+/g, '_');
    addTaskTypeMut.mutate(
      { key, label: trimmed, color: 'bg-gray-100 text-gray-700' },
      {
        onSuccess: () => {
          setType(key as TaskType);
          setTitle(generateTitle(clientId, key as TaskType));
          setNewTypeLabel('');
          setShowNewType(false);
        },
      }
    );
  };


  const responsibleOptions = useMemo(() => {
    if (!selectedClient?.squadId) return appUsers;
    const filtered = appUsers.filter(u => u.squadIds?.includes(selectedClient.squadId!));
    return filtered.length > 0 ? filtered : appUsers;
  }, [selectedClient, appUsers]);

  const resetForm = () => {
    setClientId(defaultClientId ?? '');
    setType('anuncio');
    setTitle('');
    setDeadline(undefined);
    setResponsible('');
    setPriority('medium');
    setEstH(0);
    setEstM(0);
    setComments('');
    setSubtaskInput('');
    setSubtasks([]);
    setSelectedPlatforms(defaultPlatformSlug ? [defaultPlatformSlug] : []);
  };

  const handleSubmit = () => {
    if (!clientId || !title || !deadline || !responsible) {
      toast({ title: 'Preencha os campos obrigatórios', description: 'Cliente, nome, prazo e responsável são obrigatórios.', variant: 'destructive' });
      return;
    }

    const client = visibleClients.find((c) => c.id === clientId)!;

    const newTask: Task = {
      id: `t_${Date.now()}`,
      title,
      clientId,
      clientName: client.name,
      responsible,
      type,
      estimatedTime: hmToHours(estH, estM),
      deadline: deadline.toISOString().split('T')[0],
      status: defaultStatus,
      priority,
      comments,
      createdAt: new Date().toISOString().split('T')[0],
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
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
          {defaultClientId ? (
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <div className="px-3 py-2 rounded-md bg-muted text-sm font-medium">{defaultClientName}</div>
            </div>
          ) : (
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
          )}


          {/* Tipo de demanda */}
          <div className="space-y-1.5">
            <Label>Tipo de demanda *</Label>
            {showNewType ? (
              <div className="flex gap-2">
                <Input
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  placeholder="Nome do novo tipo"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomType(); } }}
                  autoFocus
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddCustomType}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewType(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={typePopoverOpen} className="w-full justify-between font-normal">
                    {allTypes[type]?.label ?? type}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar tipo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                      <CommandGroup>
                        {Object.entries(allTypes).map(([key, conf]) => (
                          <CommandItem
                            key={key}
                            value={conf.label}
                            onSelect={() => {
                              handleTypeChange(key as TaskType);
                              setTypePopoverOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', type === key ? 'opacity-100' : 'opacity-0')} />
                            {conf.label}
                          </CommandItem>
                        ))}
                        <CommandItem
                          value="__criar_novo_tipo__"
                          onSelect={() => {
                            setShowNewType(true);
                            setTypePopoverOpen(false);
                          }}
                          className="text-primary font-medium"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Criar novo tipo
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
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
            <Select value={responsible} onValueChange={setResponsible}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {responsibleOptions.map((u) => (
                  <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plataformas */}
          {!defaultPlatformSlug && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Plataformas</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => {
                  const active = selectedPlatforms.includes(p.slug);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlatforms(prev => active ? prev.filter(s => s !== p.slug) : [...prev, p.slug])}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                      )}
                    >
                      {p.name}
                    </button>
                  );
                })}
                {platforms.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma plataforma cadastrada</span>}
              </div>
            </div>
          )}

          {/* Tempo estimado */}
          <div className="space-y-1.5">
            <Label>Tempo estimado</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input type="number" min={0} value={estH} onChange={(e) => setEstH(parseInt(e.target.value) || 0)} placeholder="0" />
                <span className="text-[10px] text-muted-foreground">horas</span>
              </div>
              <div className="flex-1">
                <Input type="number" min={0} max={59} step={5} value={estM} onChange={(e) => setEstM(Math.min(59, parseInt(e.target.value) || 0))} placeholder="0" />
                <span className="text-[10px] text-muted-foreground">minutos</span>
              </div>
            </div>
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
