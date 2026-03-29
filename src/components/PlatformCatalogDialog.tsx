import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useTaskTypesQuery } from '@/hooks/useTaskTypesQuery';
import type { ChecklistItem, PlatformCatalogRow } from '@/hooks/usePlatformCatalogQuery';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  platform?: PlatformCatalogRow | null;
  onSave: (data: Omit<PlatformCatalogRow, 'id' | 'created_at'>) => void;
  saving?: boolean;
}

const emptyChecklist: ChecklistItem = { id: '', label: '', etapa: 'onboarding', bloqueia_passagem: true };

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function PlatformCatalogDialog({ open, onOpenChange, platform, onSave, saving }: Props) {
  const { data: taskTypes = [] } = useTaskTypesQuery();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('ativo');
  const [prazoOnboarding, setPrazoOnboarding] = useState(15);
  const [prazoImplementacao, setPrazoImplementacao] = useState(30);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [tiposDemanda, setTiposDemanda] = useState<string[]>([]);
  const [criterios, setCriterios] = useState<string[]>([]);
  const [newCriterio, setNewCriterio] = useState('');
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (platform) {
      setName(platform.name);
      setSlug(platform.slug);
      setStatus(platform.status);
      setPrazoOnboarding(platform.prazo_onboarding);
      setPrazoImplementacao(platform.prazo_implementacao);
      setChecklist(platform.checklist_obrigatorio ?? []);
      setTiposDemanda(platform.tipos_demanda_permitidos ?? []);
      setCriterios(platform.criterios_passagem ?? []);
      setSlugManual(true);
    } else {
      setName(''); setSlug(''); setStatus('ativo');
      setPrazoOnboarding(15); setPrazoImplementacao(30);
      setChecklist([]); setTiposDemanda([]); setCriterios([]);
      setNewCriterio(''); setSlugManual(false);
    }
  }, [platform, open]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const addChecklistItem = () => {
    setChecklist(prev => [...prev, { ...emptyChecklist, id: crypto.randomUUID() }]);
  };

  const updateChecklistItem = (idx: number, patch: Partial<ChecklistItem>) => {
    setChecklist(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const removeChecklistItem = (idx: number) => {
    setChecklist(prev => prev.filter((_, i) => i !== idx));
  };

  const addCriterio = () => {
    if (!newCriterio.trim()) return;
    setCriterios(prev => [...prev, newCriterio.trim()]);
    setNewCriterio('');
  };

  const toggleTipoDemanda = (key: string) => {
    setTiposDemanda(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSubmit = () => {
    if (!name.trim() || !slug.trim()) { toast.error('Nome e slug são obrigatórios'); return; }
    onSave({
      name: name.trim(), slug: slug.trim(), status,
      prazo_onboarding: prazoOnboarding, prazo_implementacao: prazoImplementacao,
      checklist_obrigatorio: checklist, tipos_demanda_permitidos: tiposDemanda,
      criterios_passagem: criterios,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{platform ? 'Editar Plataforma' : 'Nova Plataforma'}</DialogTitle>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={['basico', 'prazos', 'checklist', 'criterios']} className="space-y-2">
          {/* Básico */}
          <AccordionItem value="basico">
            <AccordionTrigger className="text-sm font-semibold">Informações Básicas</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Mercado Livre" />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true); }} placeholder="mercado_livre" />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Prazos */}
          <AccordionItem value="prazos">
            <AccordionTrigger className="text-sm font-semibold">Prazos (dias úteis)</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Onboarding</Label>
                  <Input type="number" min={1} value={prazoOnboarding} onChange={e => setPrazoOnboarding(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Implementação</Label>
                  <Input type="number" min={1} value={prazoImplementacao} onChange={e => setPrazoImplementacao(Number(e.target.value))} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Checklist */}
          <AccordionItem value="checklist">
            <AccordionTrigger className="text-sm font-semibold">Checklist Obrigatório ({checklist.length} itens)</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {checklist.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Input
                    className="flex-1 h-8 text-xs"
                    value={item.label}
                    onChange={e => updateChecklistItem(idx, { label: e.target.value })}
                    placeholder="Nome do item"
                  />
                  <Select value={item.etapa} onValueChange={v => updateChecklistItem(idx, { etapa: v })}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="implementacao">Implementação</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Checkbox
                      checked={item.bloqueia_passagem}
                      onCheckedChange={v => updateChecklistItem(idx, { bloqueia_passagem: !!v })}
                    />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Bloqueia</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeChecklistItem(idx)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addChecklistItem} className="w-full">
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Item
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Tipos de demanda */}
          <AccordionItem value="tipos">
            <AccordionTrigger className="text-sm font-semibold">Tipos de Demanda Permitidos</AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                {taskTypes.map(tt => (
                  <Badge
                    key={tt.key}
                    variant={tiposDemanda.includes(tt.key) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTipoDemanda(tt.key)}
                  >
                    {tt.label}
                  </Badge>
                ))}
                {taskTypes.length === 0 && <p className="text-xs text-muted-foreground">Nenhum tipo de demanda cadastrado.</p>}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Critérios de passagem */}
          <AccordionItem value="criterios">
            <AccordionTrigger className="text-sm font-semibold">Critérios de Passagem ({criterios.length})</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {criterios.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{c}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCriterios(prev => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newCriterio}
                  onChange={e => setNewCriterio(e.target.value)}
                  placeholder="Novo critério..."
                  className="h-8 text-xs"
                  onKeyDown={e => e.key === 'Enter' && addCriterio()}
                />
                <Button variant="outline" size="sm" onClick={addCriterio}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
