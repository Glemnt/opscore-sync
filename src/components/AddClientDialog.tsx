import { useState } from 'react';
import { format } from 'date-fns';
import { Check, ListChecks } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSquads } from '@/contexts/SquadsContext';
import { useClients } from '@/contexts/ClientsContext';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import { ContractType, Client, Task, TaskType, SubTask, Platform, FaseMacro, PerfilCliente, StatusFinanceiro, RiscoChurn, TipoCliente, PrioridadeGeral } from '@/types';
import { usePlatformsQuery } from '@/hooks/usePlatformsQuery';
import { useAddClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useAddClientFlow } from '@/hooks/useClientFlowsQuery';
import { cn } from '@/lib/utils';

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
  hideFields?: string[];
  defaultSquadId?: string;
}

const DEFAULT_TEMPLATES = [
  { id: 'default_1', name: 'Criação de Campanha', subtasks: ['Briefing', 'Copy', 'Design', 'Revisão', 'Publicação'] },
  { id: 'default_2', name: 'Setup de Conta', subtasks: ['Acesso à plataforma', 'Pixel', 'Conversões', 'Público', 'Criativo'] },
  { id: 'default_3', name: 'Relatório Mensal', subtasks: ['Coleta de dados', 'Análise', 'Slides', 'Revisão', 'Envio'] },
  { id: 'default_4', name: 'Otimização de Campanha', subtasks: ['Análise de métricas', 'Ajuste de público', 'Ajuste de criativos', 'Testes A/B', 'Relatório'] },
];

export function AddClientDialog({ open, onClose, hideFields = [], defaultSquadId }: AddClientDialogProps) {
  const { addClient } = useClients();
  const { addTask, customTemplates, flows } = useTasks();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.accessLevel === 3;

  const [tab, setTab] = useState<'dados' | 'fluxo'>('dados');

  // Client fields - basic
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [perfilCliente, setPerfilCliente] = useState<PerfilCliente>('brasileiro');
  const [segment, setSegment] = useState('');
  const [contractType, setContractType] = useState<ContractType>('mrr');
  const [paymentDay, setPaymentDay] = useState('10');
  const [contractDuration, setContractDuration] = useState('6');
  const { squads } = useSquads();
  const [squadId, setSquadId] = useState(defaultSquadId ?? squads[0]?.id ?? '');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [setupFee, setSetupFee] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [responsible, setResponsible] = useState('');

  // Contact
  const [phone, setPhone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');

  // Company data
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [logisticaPrincipal, setLogisticaPrincipal] = useState('');
  const [nomeProprietario, setNomeProprietario] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState('');

  // Internal team
  const [csResponsavel, setCsResponsavel] = useState('');
  const [manager, setManager] = useState('');
  const [auxiliar, setAuxiliar] = useState('');
  const [assistente, setAssistente] = useState('');
  const [consultorAtual, setConsultorAtual] = useState('');

  // Financial
  const [vendedor, setVendedor] = useState('');
  const [statusFinanceiro, setStatusFinanceiro] = useState<StatusFinanceiro>('em_dia');
  const [multaRescisoria, setMultaRescisoria] = useState('');
  const [dataFimPrevista, setDataFimPrevista] = useState('');

  // Operational
  const [faseMacro, setFaseMacro] = useState<FaseMacro>('implementacao');
  const [subStatus, setSubStatus] = useState('');
  const [riscoChurn, setRiscoChurn] = useState<RiscoChurn>('baixo');
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('seller');
  const [prioridadeGeral, setPrioridadeGeral] = useState<PrioridadeGeral>('P2');
  const [npsUltimo, setNpsUltimo] = useState('');

  const { data: platformOptions = [] } = usePlatformsQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const addClientFlowMutation = useAddClientFlow();
  const addClientPlatformMut = useAddClientPlatform();

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const flowsAsTemplates = flows.map(f => ({ id: f.id, name: f.name, subtasks: f.steps }));
  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates, ...flowsAsTemplates];

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setName(''); setCompanyName(''); setRazaoSocial(''); setPerfilCliente('brasileiro');
    setContractType('mrr'); setPaymentDay('10'); setContractDuration('6'); setSegment('');
    setSquadId(defaultSquadId ?? squads[0]?.id ?? ''); setMonthlyRevenue(''); setSetupFee('');
    setPlatforms([]); setResponsible('');
    setPhone(''); setCnpj(''); setEmail('');
    setEndereco(''); setCidade(''); setEstado(''); setLogisticaPrincipal('');
    setNomeProprietario(''); setCpfResponsavel('');
    setCsResponsavel(''); setManager(''); setAuxiliar(''); setAssistente(''); setConsultorAtual('');
    setVendedor(''); setStatusFinanceiro('em_dia'); setMultaRescisoria(''); setDataFimPrevista('');
    setFaseMacro('implementacao'); setSubStatus(''); setRiscoChurn('baixo');
    setTipoCliente('seller'); setPrioridadeGeral('P2'); setNpsUltimo('');
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
      responsible,
      squadId,
      startDate: new Date().toISOString().split('T')[0],
      status: faseMacro === 'implementacao' ? 'onboarding' : faseMacro,
      notes: '',
      monthlyRevenue: monthlyRevenue ? Number(monthlyRevenue) : undefined,
      setupFee: setupFee ? Number(setupFee) : undefined,
      activeProjects: 0,
      pendingTasks: selectedTemplateIds.length,
      contractType,
      paymentDay: Number(paymentDay),
      contractDurationMonths: Number(contractDuration),
      platform: platforms[0],
      platforms,
      phone: phone.trim() || undefined,
      cnpj: cnpj.trim() || undefined,
      email: email.trim() || undefined,
      razaoSocial: razaoSocial.trim(),
      perfilCliente,
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      logisticaPrincipal: logisticaPrincipal.trim(),
      nomeProprietario: nomeProprietario.trim(),
      cpfResponsavel: cpfResponsavel.trim(),
      csResponsavel,
      manager,
      auxiliar,
      assistente,
      consultorAtual,
      vendedor: vendedor.trim(),
      statusFinanceiro,
      multaRescisoria: multaRescisoria ? Number(multaRescisoria) : undefined,
      dataFimPrevista: dataFimPrevista || undefined,
      faseMacro,
      subStatus: faseMacro === 'implementacao' && subStatus ? subStatus as any : null,
      riscoChurn,
      tipoCliente,
      prioridadeGeral,
      npsUltimo: npsUltimo ? Number(npsUltimo) : undefined,
      changeLogs: [],
      chatNotes: [],
    };

    addClient(newClient);

    platforms.forEach(slug => {
      addClientPlatformMut.mutate({
        clientId,
        platformSlug: slug,
        phase: 'onboarding',
        squadId: squadId || null,
      });
    });

    const flowIds = flows.map(f => f.id);
    selectedTemplateIds
      .filter(id => flowIds.includes(id))
      .forEach(flowId => {
        addClientFlowMutation.mutate({ clientId, flowId });
      });

    const squad = squads.find(s => s.id === squadId);
    const defaultResponsible = squad?.leader ?? currentUser?.name ?? '';

    selectedTemplateIds.forEach((tplId) => {
      const tpl = allTemplates.find(t => t.id === tplId);
      if (!tpl) return;

      const subtasks: SubTask[] = tpl.subtasks.map((label) => ({
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

  const selectClass = "w-full h-8 px-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)} className="mb-2">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1 text-xs">Dados</TabsTrigger>
            <TabsTrigger value="fluxo" className="flex-1 text-xs">Fluxo de Demandas</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'dados' && (
          <div className="space-y-2">
            <Accordion type="multiple" defaultValue={['identificacao', 'plataformas']} className="w-full">
              {/* IDENTIFICAÇÃO */}
              <AccordionItem value="identificacao">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider py-2">Identificação</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nome do Cliente *</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Nome da Empresa *</Label>
                        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Empresa XYZ LTDA" className="h-8 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Razão Social</Label>
                        <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Razão Social" className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Perfil do Cliente</Label>
                        <select value={perfilCliente} onChange={e => setPerfilCliente(e.target.value as PerfilCliente)} className={selectClass}>
                          <option value="brasileiro">Brasileiro</option>
                          <option value="boliviano">Boliviano</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Segmento</Label>
                      <Input value={segment} onChange={e => setSegment(e.target.value)} placeholder="Moda, Eletrônicos..." className="h-8 text-sm" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* DADOS DA EMPRESA */}
              <AccordionItem value="empresa">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider py-2">Dados da Empresa</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">CNPJ</Label>
                        <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">CPF Responsável</Label>
                        <Input value={cpfResponsavel} onChange={e => setCpfResponsavel(e.target.value)} placeholder="000.000.000-00" className="h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Nome do Proprietário</Label>
                      <Input value={nomeProprietario} onChange={e => setNomeProprietario(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Endereço</Label>
                      <Input value={endereco} onChange={e => setEndereco(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Cidade</Label>
                        <Input value={cidade} onChange={e => setCidade(e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Estado (UF)</Label>
                        <Input value={estado} onChange={e => setEstado(e.target.value)} placeholder="SP" maxLength={2} className="h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Logística Principal</Label>
                      <Input value={logisticaPrincipal} onChange={e => setLogisticaPrincipal(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* CONTATO */}
              <AccordionItem value="contato">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider py-2">Contato</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Telefone / WhatsApp</Label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@empresa.com" className="h-8 text-sm" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* EQUIPE INTERNA */}
              <AccordionItem value="equipe">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider py-2">Equipe Interna</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Responsável</Label>
                      <select value={responsible} onChange={e => setResponsible(e.target.value)} className={selectClass}>
                        <option value="">—</option>
                        {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">CS Responsável</Label>
                      <select value={csResponsavel} onChange={e => setCsResponsavel(e.target.value)} className={selectClass}>
                        <option value="">—</option>
                        {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Manager</Label>
                      <select value={manager} onChange={e => setManager(e.target.value)} className={selectClass}>
                        <option value="">—</option>
                        {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Auxiliar</Label>
                      <select value={auxiliar} onChange={e => setAuxiliar(e.target.value)} className={selectClass}>
                        <option value="">—</option>
                        {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Assistente</Label>
                      <select value={assistente} onChange={e => setAssistente(e.target.value)} className={selectClass}>
                        <option value="">—</option>
                        {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Consultor Atual</Label>
                      <select value={consultorAtual} onChange={e => setConsultorAtual(e.target.value)} className={selectClass}>
                        <option value="">—</option>
                        {appUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* FINANCEIRO */}
              {isAdmin && (
                <AccordionItem value="financeiro">
                  <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider py-2">Financeiro</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Mensalidade (R$)</Label>
                          <Input type="number" value={monthlyRevenue} onChange={e => setMonthlyRevenue(e.target.value)} placeholder="3500" className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Setup (R$)</Label>
                          <Input type="number" value={setupFee} onChange={e => setSetupFee(e.target.value)} placeholder="1500" className="h-8 text-sm" />
                        </div>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Dia de Pagamento</Label>
                          <Input type="number" min={1} max={31} value={paymentDay} onChange={e => setPaymentDay(e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Duração do Contrato</Label>
                          <select value={contractDuration} onChange={e => setContractDuration(e.target.value)} className={selectClass}>
                            <option value="6">6 meses</option>
                            <option value="12">12 meses</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Vendedor</Label>
                          <Input value={vendedor} onChange={e => setVendedor(e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Status Financeiro</Label>
                          <select value={statusFinanceiro} onChange={e => setStatusFinanceiro(e.target.value as StatusFinanceiro)} className={selectClass}>
                            <option value="em_dia">Em dia</option>
                            <option value="atrasado">Atrasado</option>
                            <option value="inadimplente">Inadimplente</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Multa Rescisória (R$)</Label>
                          <Input type="number" value={multaRescisoria} onChange={e => setMultaRescisoria(e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Data Fim Prevista</Label>
                          <Input type="date" value={dataFimPrevista} onChange={e => setDataFimPrevista(e.target.value)} className="h-8 text-sm" />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* PRAZOS E STATUS */}
              <AccordionItem value="status">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider py-2">Prazos e Status</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Fase Macro</Label>
                        <select value={faseMacro} onChange={e => setFaseMacro(e.target.value as FaseMacro)} className={selectClass}>
                          <option value="implementacao">Implementação</option>
                          <option value="performance">Performance</option>
                          <option value="escala">Escala</option>
                          <option value="pausado">Pausado</option>
                          <option value="cancelado">Cancelado</option>
                          <option value="inativo">Inativo</option>
                        </select>
                      </div>
                      {faseMacro === 'implementacao' && (
                        <div>
                          <Label className="text-xs">Sub-Status</Label>
                          <select value={subStatus} onChange={e => setSubStatus(e.target.value)} className={selectClass}>
                            <option value="">—</option>
                            <option value="onboard">Onboard (D1-D15)</option>
                            <option value="implementacao_ativa">Implementação Ativa</option>
                            <option value="validacao_final">Validação Final</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Risco de Churn</Label>
                        <select value={riscoChurn} onChange={e => setRiscoChurn(e.target.value as RiscoChurn)} className={selectClass}>
                          <option value="baixo">Baixo</option>
                          <option value="medio">Médio</option>
                          <option value="alto">Alto</option>
                          <option value="critico">Crítico</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Tipo de Cliente</Label>
                        <select value={tipoCliente} onChange={e => setTipoCliente(e.target.value as TipoCliente)} className={selectClass}>
                          <option value="seller">Seller</option>
                          <option value="lojista">Lojista</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Prioridade Geral</Label>
                        <select value={prioridadeGeral} onChange={e => setPrioridadeGeral(e.target.value as PrioridadeGeral)} className={selectClass}>
                          <option value="P1">P1 - Urgente</option>
                          <option value="P2">P2 - Alta</option>
                          <option value="P3">P3 - Normal</option>
                          <option value="P4">P4 - Baixa</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">NPS (0-10)</Label>
                        <Input type="number" min={0} max={10} step={0.1} value={npsUltimo} onChange={e => setNpsUltimo(e.target.value)} className="h-8 text-sm" />
                      </div>
                    </div>
                    {/* Non-admin: show squad here */}
                    <div>
                      <Label className="text-xs">Squad</Label>
                      <select value={squadId} onChange={e => setSquadId(e.target.value)} className={selectClass}>
                        {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* PLATAFORMAS */}
              <AccordionItem value="plataformas">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider py-2">Plataformas</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>

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
