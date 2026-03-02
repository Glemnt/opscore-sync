import { useState } from 'react';
import { format } from 'date-fns';
import { Check, ListChecks } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSquads } from '@/contexts/SquadsContext';
import { useClients } from '@/contexts/ClientsContext';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import { ContractType, Client, Task, TaskType, SubTask, Platform } from '@/types';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useAddClientFlow } from '@/hooks/useClientFlowsQuery';
import { cn } from '@/lib/utils';

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_TEMPLATES = [
  { id: 'default_1', name: 'Criação de Campanha', subtasks: ['Briefing', 'Copy', 'Design', 'Revisão', 'Publicação'] },
  { id: 'default_2', name: 'Setup de Conta', subtasks: ['Acesso à plataforma', 'Pixel', 'Conversões', 'Público', 'Criativo'] },
  { id: 'default_3', name: 'Relatório Mensal', subtasks: ['Coleta de dados', 'Análise', 'Slides', 'Revisão', 'Envio'] },
  { id: 'default_4', name: 'Otimização de Campanha', subtasks: ['Análise de métricas', 'Ajuste de público', 'Ajuste de criativos', 'Testes A/B', 'Relatório'] },
];

export function AddClientDialog({ open, onClose }: AddClientDialogProps) {
  const { addClient } = useClients();
  const { addTask, customTemplates, flows } = useTasks();
  const { currentUser } = useAuth();

  const [tab, setTab] = useState<'dados' | 'fluxo'>('dados');

  // Client fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contractType, setContractType] = useState<ContractType>('mrr');
  const [paymentDay, setPaymentDay] = useState('10');
  const [contractDuration, setContractDuration] = useState('3');
  const [segment, setSegment] = useState('');
  const { squads } = useSquads();
  const [squadId, setSquadId] = useState(squads[0]?.id ?? '');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [responsible, setResponsible] = useState('');
  const { data: platformOptions = [] } = usePlatformsQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const addClientFlowMutation = useAddClientFlow();

  // Selected templates for auto-creation
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  // Merge default templates, custom templates, and flows into a single list
  const flowsAsTemplates = flows.map(f => ({ id: f.id, name: f.name, subtasks: f.steps }));
  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates, ...flowsAsTemplates];

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setName(''); setCompanyName(''); setContractType('mrr');
    setPaymentDay('10'); setContractDuration('3'); setSegment('');
    setSquadId(squads[0]?.id ?? ''); setMonthlyRevenue('');
    setPlatforms([]); setResponsible('');
    setSelectedTemplateIds([]);
    setTab('dados');
  };

  const handleSubmit = () => {
    if (!name.trim() || !companyName.trim()) return;

    const clientId = crypto.randomUUID();
    const clientName = name.trim();

    const newClient: Client = {
      id: clientId,
      name: clientName,
      companyName: companyName.trim(),
      segment: segment.trim() || 'Geral',
      responsible: responsible,
      squadId,
      startDate: new Date().toISOString().split('T')[0],
      status: 'onboarding',
      notes: '',
      monthlyRevenue: monthlyRevenue ? Number(monthlyRevenue) : undefined,
      activeProjects: 0,
      pendingTasks: selectedTemplateIds.length,
      contractType,
      paymentDay: Number(paymentDay),
      contractDurationMonths: contractType === 'tcv' ? Number(contractDuration) : undefined,
      platform: platforms[0],
      platforms,
      changeLogs: [],
      chatNotes: [],
    };

    addClient(newClient);

    // Persist flow associations for selected flows (not default/custom templates)
    const flowIds = flows.map(f => f.id);
    selectedTemplateIds
      .filter(id => flowIds.includes(id))
      .forEach(flowId => {
        addClientFlowMutation.mutate({ clientId, flowId });
      });

    // Auto-create tasks from selected templates
    const squad = squads.find(s => s.id === squadId);
    const defaultResponsible = squad?.leader ?? currentUser?.name ?? '';

    selectedTemplateIds.forEach((tplId, idx) => {
      const tpl = allTemplates.find(t => t.id === tplId);
      if (!tpl) return;

      const subtasks: SubTask[] = tpl.subtasks.map((label, i) => ({
        id: crypto.randomUUID(),
        label,
        done: false,
      }));

      const newTask: Task = {
        id: crypto.randomUUID(),
        title: tpl.name,
        clientId,
        clientName,
        responsible: defaultResponsible,
        type: 'anuncio' as TaskType,
        estimatedTime: 0,
        deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        status: 'backlog',
        priority: 'medium',
        comments: '',
        createdAt: format(new Date(), 'yyyy-MM-dd'),
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        chatNotes: [],
      };

      addTask(newTask);
    });

    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)} className="mb-2">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1 text-xs">Dados</TabsTrigger>
            <TabsTrigger value="fluxo" className="flex-1 text-xs">Fluxo de Demandas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* TAB: Dados do Cliente */}
        {tab === 'dados' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do Cliente</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Nome da Empresa</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Empresa XYZ LTDA" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Segmento</Label>
                <Input value={segment} onChange={e => setSegment(e.target.value)} placeholder="Moda..." className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Mensalidade (R$)</Label>
                <Input type="number" value={monthlyRevenue} onChange={e => setMonthlyRevenue(e.target.value)} placeholder="3500" className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Plataformas</Label>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Squad</Label>
                <select value={squadId} onChange={e => setSquadId(e.target.value)} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                  {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Responsável</Label>
                <select value={responsible} onChange={e => setResponsible(e.target.value)} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                  <option value="">Selecione...</option>
                  {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Dia de Pagamento</Label>
              <Input type="number" min={1} max={31} value={paymentDay} onChange={e => setPaymentDay(e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Tipo de Contrato</Label>
              <RadioGroup value={contractType} onValueChange={v => setContractType(v as ContractType)} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="mrr" id="mrr-client" className="w-3.5 h-3.5" />
                  <Label htmlFor="mrr-client" className="text-xs cursor-pointer">MRR (Mensal)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="tcv" id="tcv-client" className="w-3.5 h-3.5" />
                  <Label htmlFor="tcv-client" className="text-xs cursor-pointer">TCV (Contrato)</Label>
                </div>
              </RadioGroup>
            </div>
            {contractType === 'tcv' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <Label className="text-xs">Duração do Contrato</Label>
                <select value={contractDuration} onChange={e => setContractDuration(e.target.value)} className="w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                  <option value="3">3 meses</option>
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                </select>
              </div>
            )}

            {/* Summary of selected templates */}
            {selectedTemplateIds.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-primary" />
                  {selectedTemplateIds.length} fluxo(s) de demanda selecionado(s)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplateIds.map(id => {
                    const tpl = allTemplates.find(t => t.id === id);
                    return tpl ? (
                      <span key={id} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tpl.name}</span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !companyName.trim()}
              className="w-full py-2 mt-2 gradient-primary text-primary-foreground rounded-lg text-sm font-medium shadow-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar Cliente {selectedTemplateIds.length > 0 ? `(+ ${selectedTemplateIds.length} demanda${selectedTemplateIds.length > 1 ? 's' : ''})` : ''}
            </button>
          </div>
        )}

        {/* TAB: Fluxo de Demandas */}
        {tab === 'fluxo' && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Selecione os templates de demanda que serão criados automaticamente ao adicionar o cliente.
            </p>
            <div className="space-y-2">
              {allTemplates.map(tpl => {
                const isSelected = selectedTemplateIds.includes(tpl.id);
                return (
                  <button
                    key={tpl.id}
                    onClick={() => toggleTemplate(tpl.id)}
                    className={cn(
                      'w-full text-left rounded-lg border p-3 transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{tpl.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({tpl.subtasks.length} subtarefas)</span>
                      </div>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tpl.subtasks.map((st, i) => (
                        <span key={i} className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">{st}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedTemplateIds.length > 0 && (
              <p className="text-xs text-primary font-medium text-center">
                {selectedTemplateIds.length} fluxo(s) selecionado(s) — serão criados ao adicionar o cliente
              </p>
            )}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
