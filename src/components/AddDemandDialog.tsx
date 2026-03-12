import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { CalendarIcon, Plus, X, Trash2, Save, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';
import { Task, TaskType, TaskStatus, Priority, SubTask } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, CustomTemplate } from '@/contexts/TasksContext';
import { useSquads } from '@/contexts/SquadsContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddDemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Task) => void;
  columnStatus: TaskStatus;
  clientId: string;
  clientName: string;
  squadMembers: string[];
}

const DEFAULT_TEMPLATES = [
  {
    id: 'default_1',
    name: 'Criação de Campanha',
    subtasks: ['Briefing', 'Copy', 'Design', 'Revisão', 'Publicação'],
  },
  {
    id: 'default_2',
    name: 'Setup de Conta',
    subtasks: ['Acesso à plataforma', 'Pixel', 'Conversões', 'Público', 'Criativo'],
  },
  {
    id: 'default_3',
    name: 'Relatório Mensal',
    subtasks: ['Coleta de dados', 'Análise', 'Slides', 'Revisão', 'Envio'],
  },
  {
    id: 'default_4',
    name: 'Otimização de Campanha',
    subtasks: ['Análise de métricas', 'Ajuste de público', 'Ajuste de criativos', 'Testes A/B', 'Relatório'],
  },
];

const priorities: { value: Priority; label: string }[] = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
];

export function AddDemandDialog({
  open,
  onOpenChange,
  onSubmit,
  columnStatus,
  clientId,
  clientName,
  squadMembers,
}: AddDemandDialogProps) {
  const { currentUser } = useAuth();
  const { customTemplates, addTemplate, updateTemplate, removeTemplate, flows } = useTasks();
  const { squads } = useSquads();
  const { data: platformOptions = [] } = usePlatformsQuery();

  const visibleMembers: string[] = useMemo(() => {
    if (!currentUser) return squadMembers;
    if (currentUser.accessLevel === 3) {
      return Array.from(new Set<string>(squads.flatMap((s) => s.members)));
    }
    const userSquads = squads.filter((s) => currentUser.squadIds.includes(s.id) || s.leader === currentUser.name);
    return Array.from(new Set<string>(userSquads.flatMap((s) => s.members)));
  }, [currentUser, squadMembers, squads]);

  const [mode, setMode] = useState<'new' | 'template' | 'create_template' | 'edit_template'>('new');
  const [title, setTitle] = useState('');
  const [responsible, setResponsible] = useState('');
  const [deadline, setDeadline] = useState<Date>();
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Create/edit template state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplSubtasks, setTplSubtasks] = useState<string[]>([]);
  const [tplNewSubtask, setTplNewSubtask] = useState('');

  const flowsAsTemplates = flows.map(f => ({ id: f.id, name: f.name, subtasks: f.steps }));
  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates, ...flowsAsTemplates];

  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    const tpl = allTemplates.find((t) => t.name === templateName);
    if (tpl) {
      setTitle(tpl.name);
      setSubtasks(
        tpl.subtasks.map((label, i) => ({
          id: `st_${Date.now()}_${i}`,
          label,
          done: false,
        }))
      );
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [...prev, { id: `st_${Date.now()}`, label: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const resetForm = () => {
    setTitle('');
    setResponsible('');
    setDeadline(undefined);
    setPriority('medium');
    setSelectedTemplate('');
    setSubtasks([]);
    setNewSubtask('');
    setMode('new');
    setSelectedPlatforms([]);
    setTplName('');
    setTplSubtasks([]);
    setTplNewSubtask('');
    setEditingTemplateId(null);
  };

  const handleSubmit = () => {
    if (!title.trim() || !responsible || !deadline) return;

    const newTask: Task = {
      id: `t_${Date.now()}`,
      title: title.trim(),
      clientId,
      clientName,
      responsible,
      type: 'anuncio' as TaskType,
      estimatedTime: 0,
      deadline: format(deadline, 'yyyy-MM-dd'),
      status: columnStatus,
      priority,
      comments: '',
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      chatNotes: [],
    };

    onSubmit(newTask);
    onOpenChange(false);
    resetForm();
  };

  const handleSaveTemplate = () => {
    if (!tplName.trim() || tplSubtasks.length === 0) return;
    if (editingTemplateId) {
      updateTemplate(editingTemplateId, { name: tplName.trim(), subtasks: [...tplSubtasks] });
    } else {
      addTemplate({
        id: `tpl_${Date.now()}`,
        name: tplName.trim(),
        subtasks: [...tplSubtasks],
      });
    }
    setTplName('');
    setTplSubtasks([]);
    setTplNewSubtask('');
    setEditingTemplateId(null);
    setMode('template');
  };

  const startEditTemplate = (t: CustomTemplate) => {
    setEditingTemplateId(t.id);
    setTplName(t.name);
    setTplSubtasks([...t.subtasks]);
    setTplNewSubtask('');
  };

  const addTplSubtask = () => {
    if (!tplNewSubtask.trim()) return;
    setTplSubtasks((prev) => [...prev, tplNewSubtask.trim()]);
    setTplNewSubtask('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="mb-2">
          <TabsList className="w-full">
            <TabsTrigger value="new" className="flex-1 text-xs">Nova</TabsTrigger>
            <TabsTrigger value="template" className="flex-1 text-xs">Demanda Padrão</TabsTrigger>
            <TabsTrigger value="create_template" className="flex-1 text-xs">Criar Template</TabsTrigger>
            <TabsTrigger value="edit_template" className="flex-1 text-xs">Editar Template</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Create Template Mode */}
        {mode === 'create_template' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{editingTemplateId ? 'Editar Template' : 'Nome do Template'} *</Label>
              <Input
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="Ex: Lançamento de Produto"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtarefas do Template</Label>
              <div className="space-y-1.5">
                {tplSubtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-sm flex-1">{st}</span>
                    <button
                      onClick={() => setTplSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova subtarefa..."
                  value={tplNewSubtask}
                  onChange={(e) => setTplNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTplSubtask())}
                  className="flex-1"
                />
                <Button size="icon" variant="outline" onClick={addTplSubtask} disabled={!tplNewSubtask.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Existing custom templates list */}
            {customTemplates.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-muted-foreground">Seus Templates</Label>
                {customTemplates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({t.subtasks.length} subtarefas)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditTemplate(t)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar template"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeTemplate(t.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Excluir template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingTemplateId(null); setTplName(''); setTplSubtasks([]); setMode('template'); }}>Cancelar</Button>
              <Button onClick={handleSaveTemplate} disabled={!tplName.trim() || tplSubtasks.length === 0}>
                <Save className="w-4 h-4 mr-1" />
                {editingTemplateId ? 'Atualizar Template' : 'Salvar Template'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Edit Template Mode */}
        {mode === 'edit_template' && (
          <div className="space-y-4 py-2">
            {editingTemplateId ? (
              <>
                <div className="space-y-2">
                  <Label>Nome do Template *</Label>
                  <Input
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    placeholder="Nome do template"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtarefas do Template</Label>
                  <div className="space-y-1.5">
                    {tplSubtasks.map((st, i) => (
                      <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-sm flex-1">{st}</span>
                        <button
                          onClick={() => setTplSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova subtarefa..."
                      value={tplNewSubtask}
                      onChange={(e) => setTplNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTplSubtask())}
                      className="flex-1"
                    />
                    <Button size="icon" variant="outline" onClick={addTplSubtask} disabled={!tplNewSubtask.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setEditingTemplateId(null); setTplName(''); setTplSubtasks([]); setTplNewSubtask(''); }}>Voltar</Button>
                  <Button onClick={() => { handleSaveTemplate(); setMode('edit_template'); }} disabled={!tplName.trim() || tplSubtasks.length === 0}>
                    <Save className="w-4 h-4 mr-1" />
                    Atualizar Template
                  </Button>
                </DialogFooter>
              </>
            ) : customTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum template criado ainda</p>
            ) : (
              <div className="space-y-2">
                {customTemplates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <button onClick={() => startEditTemplate(t)} className="text-left flex-1">
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({t.subtasks.length} subtarefas)</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setMode('edit_template'); startEditTemplate(t); }} className="text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeTemplate(t.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New / Template demand creation */}
        {mode !== 'create_template' && mode !== 'edit_template' && (
          <>
            <div className="space-y-4 py-2">
              {mode === 'template' && (
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar template" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Criar copies para campanha..."
                />
              </div>

              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Select value={responsible} onValueChange={setResponsible}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleMembers.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Entrega *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !deadline && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, 'dd/MM/yyyy') : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plataformas */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Plataformas</Label>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map((p) => {
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
                  {platformOptions.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma plataforma cadastrada</span>}
                </div>
              </div>

              {/* Subtasks section */}
              {(mode === 'template' || subtasks.length > 0) && (
                <div className="space-y-2">
                  <Label>Subtarefas</Label>
                  <div className="space-y-1.5">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-sm flex-1">{st.label}</span>
                        <button onClick={() => removeSubtask(st.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova subtarefa..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                      className="flex-1"
                    />
                    <Button size="icon" variant="outline" onClick={addSubtask} disabled={!newSubtask.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {mode === 'new' && subtasks.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setSubtasks([{ id: `st_${Date.now()}`, label: '', done: false }])}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Adicionar subtarefas
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!title.trim() || !responsible || !deadline}>
                Criar Demanda
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
