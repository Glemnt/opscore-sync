import { Client, Project, Task, TeamMember, Squad } from '@/types';

export const squads: Squad[] = [
  { id: 'sq1', name: 'Squad Alpha', leader: 'Ana Silva', members: ['Ana Silva', 'Diego Rocha'] },
  { id: 'sq2', name: 'Squad Beta', leader: 'Carlos Mendes', members: ['Carlos Mendes', 'Mariana Feitosa'] },
  { id: 'sq3', name: 'Squad Gamma', leader: 'Beatriz Costa', members: ['Beatriz Costa', 'Pedro Alves'] },
];
export const clients: Client[] = [
  {
    id: 'c1', name: 'Moda Bella Store', companyName: 'Moda Bella LTDA', segment: 'Moda Feminina',
    responsible: 'Ana Silva', squadId: 'sq1', startDate: '2024-02-01', status: 'active',
    notes: 'Cliente com foco em ML e Shopee. Expandindo para Meta Ads.',
    activeProjects: 3, pendingTasks: 8, monthlyRevenue: 4500,
    contractType: 'mrr', paymentDay: 10, platform: 'mercado_livre', healthColor: 'green' as const, changeLogs: [], chatNotes: [],
  },
  {
    id: 'c2', name: 'TechGadgets Pro', companyName: 'TechGadgets Comercio Digital LTDA', segment: 'Eletrônicos',
    responsible: 'Carlos Mendes', squadId: 'sq2', startDate: '2023-11-15', status: 'active',
    notes: 'Alta competitividade. Precisa de anúncios agressivos em precificação.',
    activeProjects: 2, pendingTasks: 5, monthlyRevenue: 6800,
    contractType: 'tcv', paymentDay: 15, contractDurationMonths: 6, platform: 'shopee', healthColor: 'red' as const, changeLogs: [], chatNotes: [],
  },
  {
    id: 'c3', name: 'Casa & Charme', companyName: 'Casa Charme Decorações ME', segment: 'Decoração e Casa',
    responsible: 'Beatriz Costa', squadId: 'sq3', startDate: '2024-01-10', status: 'active',
    notes: 'Produtos sazonais. Foco em datas comemorativas.',
    activeProjects: 2, pendingTasks: 12, monthlyRevenue: 3200,
    contractType: 'mrr', paymentDay: 5, platform: 'shein', healthColor: 'yellow' as const, changeLogs: [], chatNotes: [],
  },
  {
    id: 'c4', name: 'FitSupply Brasil', companyName: 'FitSupply Suplementos S.A.', segment: 'Suplementos e Fitness',
    responsible: 'Ana Silva', squadId: 'sq1', startDate: '2023-08-20', status: 'active',
    notes: 'Maior cliente. Operação completa em todos os canais.',
    activeProjects: 5, pendingTasks: 15, monthlyRevenue: 9500,
    contractType: 'mrr', paymentDay: 1, platform: 'mercado_livre', healthColor: 'green' as const, changeLogs: [], chatNotes: [],
  },
  {
    id: 'c5', name: 'PetAmor Shop', companyName: 'PetAmor Comércio Pet LTDA', segment: 'Pet Shop',
    responsible: 'Diego Rocha', squadId: 'sq1', startDate: '2024-03-05', status: 'onboarding',
    notes: 'Em fase de onboarding. Aguardando acesso às contas.',
    activeProjects: 1, pendingTasks: 6, monthlyRevenue: 1800,
    contractType: 'tcv', paymentDay: 20, contractDurationMonths: 3, platform: 'shopee', healthColor: 'white' as const, changeLogs: [], chatNotes: [],
  },
  {
    id: 'c6', name: 'Calçados Griffe', companyName: 'Griffe Calçados EIRELI', segment: 'Calçados',
    responsible: 'Carlos Mendes', squadId: 'sq2', startDate: '2023-06-01', status: 'paused',
    notes: 'Pausado por reformulação interna do cliente.',
    activeProjects: 0, pendingTasks: 2, monthlyRevenue: 2200,
    contractType: 'mrr', paymentDay: 25, platform: 'shein', healthColor: 'red' as const, changeLogs: [], chatNotes: [],
  },
];

export const projects: Project[] = [
  {
    id: 'p1', clientId: 'c1', clientName: 'Moda Bella Store', name: 'Criação de Anúncios Q1 2025',
    type: 'criacao_anuncio', responsible: 'Mariana Feitosa', startDate: '2025-01-15', deadline: '2025-02-15',
    priority: 'high', status: 'in_progress', progress: 65,
    checklist: [
      { id: 'ch1', label: 'Briefing aprovado', done: true },
      { id: 'ch2', label: 'Fotos recebidas', done: true },
      { id: 'ch3', label: 'Copies criados', done: true },
      { id: 'ch4', label: 'Artes aprovadas', done: false },
      { id: 'ch5', label: 'Publicação no ML', done: false },
    ],
  },
  {
    id: 'p2', clientId: 'c4', clientName: 'FitSupply Brasil', name: 'Setup Meta Ads - Fevereiro',
    type: 'setup_campanha', responsible: 'Pedro Alves', startDate: '2025-02-01', deadline: '2025-02-10',
    priority: 'high', status: 'waiting_client', progress: 40,
    checklist: [
      { id: 'ch6', label: 'Estratégia definida', done: true },
      { id: 'ch7', label: 'Públicos configurados', done: true },
      { id: 'ch8', label: 'Criativos aprovados', done: false },
      { id: 'ch9', label: 'Pixel instalado', done: false },
      { id: 'ch10', label: 'Campanha no ar', done: false },
    ],
  },
  {
    id: 'p3', clientId: 'c2', clientName: 'TechGadgets Pro', name: 'Otimização de Anúncios Shopee',
    type: 'otimizacao', responsible: 'Mariana Feitosa', startDate: '2025-01-20', deadline: '2025-02-05',
    priority: 'medium', status: 'done', progress: 100,
    checklist: [
      { id: 'ch11', label: 'Análise de dados', done: true },
      { id: 'ch12', label: 'Ajuste de preços', done: true },
      { id: 'ch13', label: 'Otimização de títulos', done: true },
      { id: 'ch14', label: 'Novas fotos', done: true },
    ],
  },
  {
    id: 'p4', clientId: 'c3', clientName: 'Casa & Charme', name: 'Campanha Dia das Mães',
    type: 'criacao_anuncio', responsible: 'Beatriz Costa', startDate: '2025-02-10', deadline: '2025-04-30',
    priority: 'medium', status: 'backlog', progress: 10,
    checklist: [
      { id: 'ch15', label: 'Planejamento', done: true },
      { id: 'ch16', label: 'Seleção de produtos', done: false },
      { id: 'ch17', label: 'Criação de copies', done: false },
      { id: 'ch18', label: 'Design das artes', done: false },
    ],
  },
  {
    id: 'p5', clientId: 'c4', clientName: 'FitSupply Brasil', name: 'Relatório de Performance Janeiro',
    type: 'relatorio', responsible: 'Ana Silva', startDate: '2025-02-01', deadline: '2025-02-07',
    priority: 'medium', status: 'done', progress: 100,
    checklist: [
      { id: 'ch19', label: 'Extração de dados', done: true },
      { id: 'ch20', label: 'Análise comparativa', done: true },
      { id: 'ch21', label: 'Apresentação montada', done: true },
      { id: 'ch22', label: 'Reunião realizada', done: true },
    ],
  },
];

export const tasks: Task[] = [
  { id: 't1', title: 'Criar copies para anúncios de verão', clientId: 'c1', clientName: 'Moda Bella Store', projectId: 'p1', projectName: 'Criação de Anúncios Q1 2025', responsible: 'Lucas Matos', type: 'copy', estimatedTime: 3, realTime: 2.5, deadline: '2025-02-20', status: 'in_progress', priority: 'high', comments: 'Foco nos produtos de verão com CTA urgência', createdAt: '2025-02-15' },
  { id: 't2', title: 'Design das artes para Meta Ads', clientId: 'c4', clientName: 'FitSupply Brasil', projectId: 'p2', projectName: 'Setup Meta Ads - Fevereiro', responsible: 'Carla Dias', type: 'design', estimatedTime: 5, deadline: '2025-02-18', status: 'backlog', priority: 'high', comments: 'Formatos: feed quadrado, story e reels', createdAt: '2025-02-14' },
  { id: 't3', title: 'Analisar métricas de campanha - Jan', clientId: 'c2', clientName: 'TechGadgets Pro', responsible: 'Pedro Alves', type: 'analise', estimatedTime: 2, realTime: 2.2, deadline: '2025-02-10', status: 'done', priority: 'medium', comments: '', createdAt: '2025-02-08' },
  { id: 't4', title: 'Otimizar títulos de 30 SKUs no ML', clientId: 'c3', clientName: 'Casa & Charme', responsible: 'Mariana Feitosa', type: 'otimizacao', estimatedTime: 4, deadline: '2025-02-12', status: 'waiting_client', priority: 'medium', comments: 'Aguardando aprovação da lista de SKUs pelo cliente', createdAt: '2025-02-05' },
  { id: 't5', title: 'Setup conta Meta Ads - PetAmor', clientId: 'c5', clientName: 'PetAmor Shop', responsible: 'Pedro Alves', type: 'setup', estimatedTime: 3, deadline: '2025-02-25', status: 'backlog', priority: 'low', comments: 'Aguardando acesso BM', createdAt: '2025-02-15' },
  { id: 't6', title: 'Reunião estratégica mensal - FitSupply', clientId: 'c4', clientName: 'FitSupply Brasil', responsible: 'Ana Silva', type: 'reuniao', estimatedTime: 1.5, realTime: 1.5, deadline: '2025-02-14', status: 'done', priority: 'high', comments: 'Alinhado estratégia Q1', createdAt: '2025-02-10' },
  { id: 't7', title: 'Criar anúncios produtos novos Shopee', clientId: 'c2', clientName: 'TechGadgets Pro', responsible: 'Mariana Feitosa', type: 'anuncio', estimatedTime: 6, deadline: '2025-02-08', status: 'in_progress', priority: 'high', comments: 'ATRASADO - iniciado com atraso por dependência de fotos', createdAt: '2025-02-01' },
  { id: 't8', title: 'Relatório mensal Casa & Charme', clientId: 'c3', clientName: 'Casa & Charme', responsible: 'Ana Silva', type: 'relatorio', estimatedTime: 2, deadline: '2025-02-20', status: 'backlog', priority: 'low', comments: '', createdAt: '2025-02-15' },
];

export const teamMembers: TeamMember[] = [
  { id: 'tm1', name: 'Ana Silva', role: 'cs', completedTasks: 42, avgTime: 1.8, lateTasks: 1, currentLoad: 5, onTimePct: 92 },
  { id: 'tm2', name: 'Mariana Feitosa', role: 'operacional', completedTasks: 67, avgTime: 3.2, lateTasks: 3, currentLoad: 8, onTimePct: 85 },
  { id: 'tm3', name: 'Lucas Matos', role: 'copy', completedTasks: 55, avgTime: 2.5, lateTasks: 0, currentLoad: 4, onTimePct: 98 },
  { id: 'tm4', name: 'Carla Dias', role: 'design', completedTasks: 38, avgTime: 4.1, lateTasks: 2, currentLoad: 6, onTimePct: 88 },
  { id: 'tm5', name: 'Pedro Alves', role: 'operacional', completedTasks: 51, avgTime: 2.8, lateTasks: 4, currentLoad: 9, onTimePct: 78 },
  { id: 'tm6', name: 'Beatriz Costa', role: 'gestao', completedTasks: 29, avgTime: 1.5, lateTasks: 0, currentLoad: 3, onTimePct: 100 },
  { id: 'tm7', name: 'Diego Rocha', role: 'cs', completedTasks: 34, avgTime: 2.0, lateTasks: 2, currentLoad: 7, onTimePct: 82 },
  { id: 'tm8', name: 'Carlos Mendes', role: 'gestao', completedTasks: 22, avgTime: 1.2, lateTasks: 0, currentLoad: 4, onTimePct: 96 },
];
