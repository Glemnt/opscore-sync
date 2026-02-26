# AssessoriaPro — Documentação Funcional do Protótipo

> Documento de referência para a software house que dará continuidade ao desenvolvimento. Descreve todas as funcionalidades implementadas no protótipo front-end (React + Vite + Tailwind CSS + TypeScript).

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Autenticação e Controle de Acesso](#3-autenticação-e-controle-de-acesso)
4. [Navegação e Layout](#4-navegação-e-layout)
5. [Dashboard](#5-dashboard)
6. [Gestão de Clientes](#6-gestão-de-clientes)
7. [Detalhamento do Cliente (Modal)](#7-detalhamento-do-cliente-modal)
8. [Análise de IA do Cliente](#8-análise-de-ia-do-cliente)
9. [Squads e Projetos (Kanban)](#9-squads-e-projetos-kanban)
10. [Demandas (Tarefas)](#10-demandas-tarefas)
11. [Produtividade](#11-produtividade)
12. [Relatórios](#12-relatórios)
13. [Configurações (Gestão de Usuários)](#13-configurações-gestão-de-usuários)
14. [Modelos de Dados](#14-modelos-de-dados)
15. [Limitações do Protótipo](#15-limitações-do-protótipo)

---

## 1. Visão Geral

**AssessoriaPro** é um sistema de gestão operacional para assessorias de marketing digital / e-commerce. Permite gerenciar clientes, squads, projetos, demandas (tarefas) e produtividade da equipe, com visão Kanban e indicadores consolidados.

O protótipo atual opera **100% no front-end** com dados mockados em memória (sem backend/banco de dados). Os dados são reiniciados a cada reload da página.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Roteamento | React Router DOM v6 (SPA) |
| Estado | React Context API (AuthContext, ClientsContext, TasksContext) |
| Componentes UI | shadcn/ui (Dialog, Select, Table, Tabs, Calendar, etc.) |
| Ícones | Lucide React |

---

## 3. Autenticação e Controle de Acesso

**Arquivo:** `src/contexts/AuthContext.tsx`, `src/pages/LoginPage.tsx`

### Funcionalidades
- Tela de login com campos de usuário e senha
- Validação local contra lista de usuários em memória
- Usuário padrão pré-cadastrado: `admin / admin123` (Beatriz Costa, nível Administrador)
- Logout via botão na sidebar

### Níveis de Acesso (AccessLevel)
| Nível | Nome | Permissões |
|-------|------|-----------|
| 1 | Operacional | Vê apenas clientes dos seus squads |
| 2 | Supervisor | Vê apenas clientes dos seus squads |
| 3 | Administrador | Vê todos os clientes, acessa Configurações |

### Filtragem por Visibilidade
- Todas as páginas filtram dados com base nos `squadIds` do usuário logado
- Nível 3 vê tudo; níveis 1 e 2 veem apenas dados dos squads atribuídos

---

## 4. Navegação e Layout

**Arquivos:** `src/components/AppSidebar.tsx`, `src/components/Layout.tsx`

### Menu Lateral (Sidebar)
- Logo "AssessoriaPro" com subtítulo "Gestão Operacional"
- Itens de navegação: Dashboard, Clientes, Squads, Demandas, Produtividade, Relatórios
- Item "Configurações" visível apenas para nível 3
- Rodapé com avatar do usuário, nome, cargo e botão de logout
- Indicador visual de página ativa (highlight + dot)

---

## 5. Dashboard

**Arquivo:** `src/pages/DashboardPage.tsx`

### KPIs (Cards superiores)
- **Clientes Ativos** — contagem de clientes com status `active`
- **Projetos em Andamento** — projetos com status `in_progress`
- **Tarefas Atrasadas** — tarefas com deadline < hoje e status ≠ `done`
- **Aguardando Cliente** — tarefas com status `waiting_client`

### Gráficos
- **Demandas da Semana** — gráfico de barras (concluídas vs abertas por dia)
- **Tipos de Demanda** — gráfico de pizza (Anúncio, Design, Copy, Análise, Outros)

### Seções Adicionais
- **Projetos Recentes** — lista dos 4 últimos projetos com status, prioridade e progresso
- **Equipe Sobrecarregada** — membros com ≥ 8 tarefas ativas em destaque

---

## 6. Gestão de Clientes

**Arquivo:** `src/pages/ClientsPage.tsx`, `src/components/AddClientDialog.tsx`

### Listagem
- Cards em grid com informações resumidas de cada cliente
- Cada card exibe: nome, segmento, squad, status, responsável, data de início

### Filtros Disponíveis
| Filtro | Tipo | Opções |
|--------|------|--------|
| Busca textual | Input | Nome ou segmento |
| Status | Pill group | Todos, Ativos, Onboarding, Pausados, Churned |
| Squad | Select | Todos + lista de squads |
| Saúde | Select | Todas, Saudável (🟢), Atenção (🟡), Crítico (🔴), Não avaliado (⚪) |
| Período de início | Date range | Data de / Data até |

### Rodapé do Card (Grid 4 colunas)
| Coluna | Dado |
|--------|------|
| Pendentes | Número de tarefas pendentes |
| Mensalidade | Valor em R$ (formatado) |
| NPS | Nota de satisfação (mock da análise IA) |
| Saúde | Círculo colorido (green/yellow/red/white) |

### Cadastro de Novo Cliente (Dialog)
- Campos: Nome, Empresa, Segmento, Squad, Receita Mensal
- Tipo de contrato: **MRR** (recorrente) ou **TCV** (valor fechado)
  - MRR → campo "Dia de pagamento"
  - TCV → campos "Dia de pagamento" + "Duração do contrato (meses)"
- Cliente criado com status `onboarding` e `healthColor: 'white'`

---

## 7. Detalhamento do Cliente (Modal)

**Arquivo:** `src/components/ClientDetailModal.tsx`

### Abas / Seções do Modal

#### 7.1 Cabeçalho
- Avatar com iniciais, nome, empresa, badge de status
- Informação do squad

#### 7.2 Dados Editáveis Inline
Todos os campos abaixo são editáveis ao clicar no ícone de edição (lápis):
- Responsável
- Squad (select com lista de squads)
- Segmento
- Início do contrato
- Receita mensal
- Observações

#### 7.3 Informações de Contrato
- Tipo de contrato (MRR ou TCV)
- Dia de pagamento
- Duração do contrato (apenas TCV)
- Próximo pagamento (calculado automaticamente)

#### 7.4 Contrato (Upload de Arquivo)
- Upload de arquivos (PDF, DOC, imagens)
- Visualizar arquivo em nova aba
- Remover arquivo
- **Nota:** Usa `URL.createObjectURL` — simulação local, sem persistência

#### 7.5 Indicador de Saúde
- Círculos coloridos selecionáveis: Verde (Saudável), Amarelo (Atenção), Vermelho (Crítico), Branco (Não avaliado)
- Editável semanalmente

#### 7.6 Demandas do Cliente
- Lista de tarefas vinculadas ao cliente
- Exibe: título, tipo (badge), status (badge), responsável, deadline, flag de atraso

#### 7.7 Chat de Anotações
- Campo de texto para enviar notas internas
- Histórico de notas com autor, mensagem e data/hora
- Scroll automático para última mensagem

#### 7.8 Histórico de Alterações (Change Log)
- Registro automático de todas as edições inline
- Exibe: campo alterado, valor anterior → novo valor, quem alterou, quando

#### 7.9 Análise de IA
- Componente separado (ver seção 8)

---

## 8. Análise de IA do Cliente

**Arquivo:** `src/components/ClientAIAnalysis.tsx`

### Dados Exibidos (mock)
- **Nota de Satisfação** — escala 0 a 10 com indicador visual
- **Sentimento** — Positivo / Neutro / Negativo (badge colorido)
- **Tempo Médio de Resposta no WhatsApp** — ex: "2h 15min"
- **Resumo de Projetos** — texto livre gerado pela "IA"
- **Próximos Passos Sugeridos** — lista de ações recomendadas para a semana
- **Data da Última Análise** — timestamp

### Observação
Os dados são **mock** (fixos por cliente). Em produção, devem ser alimentados por integração com IA real (análise de mensagens do WhatsApp, calls, etc.) e armazenados com histórico semanal.

---

## 9. Squads e Projetos (Kanban)

**Arquivo:** `src/pages/ProjectsPage.tsx`, `src/components/ProjectSummaryPanel.tsx`, `src/components/AddDemandDialog.tsx`

### Fluxo de Navegação (3 níveis)
1. **Seleção de Squad** — cards com nome, líder, nº de clientes e projetos ativos
2. **Kanban de Clientes** — colunas por status do cliente (Onboarding → Ativo → Pausado → Churned)
3. **Kanban de Projetos do Cliente** — colunas por status do projeto (Backlog → Em Andamento → Aguard. Cliente → Concluído)

### Kanban de Clientes
- Drag visual (cards arrastáveis entre colunas — apenas visual)
- Colunas editáveis (renomear título da coluna)
- Card exibe: nome, segmento, badge de status, responsável, nº de projetos e tarefas pendentes

### Kanban de Projetos (dentro de um cliente)
- Projetos organizados por status
- Card de projeto exibe: nome, tipo, prioridade (badge), responsável, progresso (barra)
- Clique no card abre painel lateral de resumo

### Painel de Resumo do Projeto
- Checklist do projeto com itens marcáveis
- Barra de progresso atualizada automaticamente
- Informações: deadline, prioridade, responsável

### Adicionar Demanda ao Projeto
- Dialog com campos: título, tipo, responsável (membros do squad), prioridade, prazo, tempo estimado, comentários
- A demanda é criada simultaneamente como **Task** (no TasksContext) e como **Project** (estado local do Kanban)

---

## 10. Demandas (Tarefas)

**Arquivo:** `src/pages/TasksPage.tsx`, `src/contexts/TasksContext.tsx`

### Visualização Kanban
- 4 colunas: Backlog, Em Andamento, Aguard. Cliente, Concluído
- Colunas com títulos editáveis
- Filtros: busca textual + responsável

### Card de Tarefa
- Título, cliente, tipo (badge), prioridade (badge)
- Responsável (avatar), deadline
- Indicador visual de atraso (⚠️ vermelho se deadline < hoje e status ≠ done)
- Tempo estimado

### Contexto Global (TasksContext)
- Estado centralizado de tarefas
- Funções: `addTask`, `updateTaskStatus`
- Tarefas filtradas por visibilidade do usuário (squads)

---

## 11. Produtividade

**Arquivo:** `src/pages/ProductivityPage.tsx`

### KPIs
- Total de tarefas concluídas
- Pontualidade média (%)
- Tarefas atrasadas (total)
- Membros sobrecarregados (≥ 8 tarefas)

### Gráficos
- **Desempenho por Colaborador** — gráfico de barras (tarefas concluídas)
- **Radar de Habilidades** — gráfico radar comparativo

### Ranking da Equipe
- Tabela ordenada por tarefas concluídas
- Colunas: nome, cargo, concluídas, tempo médio, atrasadas, carga atual, pontualidade (%)
- Badge de cargo com cores diferenciadas

---

## 12. Relatórios

**Arquivo:** `src/pages/ReportsPage.tsx`

### Cards de Relatórios Disponíveis
| Relatório | Frequência | Descrição |
|-----------|-----------|-----------|
| Semanal da Equipe | Semanal | Produtividade e pontualidade por colaborador |
| Por Cliente | Sob demanda | Volume de demandas, projetos, tempo gasto por cliente |
| Por Tipo de Tarefa | Por categoria | Distribuição e tempo médio por tipo |
| Performance por Colaborador | Histórico | Evolução detalhada por membro |

### Resumo Rápido
- Tabela com nome do membro, cargo, tarefas concluídas e pontualidade
- Badge de cargo com cores

### Observação
Atualmente os relatórios são **estáticos/mockados**. Não há funcionalidade de exportação real (PDF/Excel). Deve ser implementado no backend.

---

## 13. Configurações (Gestão de Usuários)

**Arquivo:** `src/pages/SettingsPage.tsx`

> Acessível apenas para usuários com nível de acesso 3 (Administrador)

### Funcionalidades
- **Listagem de Usuários** — tabela com nome, login, cargo, nível de acesso, squads
- **Cadastro de Novo Usuário** — dialog com:
  - Nome, Login, Senha
  - Cargo (CS, Operacional, Design, Copy, Gestão)
  - Nível de acesso (1-Operacional, 2-Supervisor, 3-Administrador)
  - Squads vinculados (seleção múltipla)
- Ícones diferenciados por nível de acesso (escudo)

---

## 14. Modelos de Dados

**Arquivo:** `src/types/index.ts`

### Client
```typescript
{
  id, name, companyName, segment, responsible, squadId,
  startDate, status (active|paused|churned|onboarding),
  notes, logo?, monthlyRevenue?, activeProjects, pendingTasks,
  contractType (mrr|tcv), paymentDay, contractDurationMonths?,
  healthColor? (green|yellow|red|white),
  contractFile? { name, url, uploadedAt },
  changeLogs: ChangeLogEntry[],
  chatNotes: ChatNote[]
}
```

### Project
```typescript
{
  id, clientId, clientName, name, type (criacao_anuncio|setup_campanha|otimizacao|relatorio|redesign|consultoria),
  responsible, startDate, deadline, priority (high|medium|low),
  status (backlog|in_progress|waiting_client|done),
  checklist: ChecklistItem[], progress
}
```

### Task
```typescript
{
  id, title, clientId, clientName, projectId?, projectName?,
  responsible, type (anuncio|copy|design|otimizacao|analise|setup|reuniao|relatorio),
  estimatedTime, realTime?, deadline,
  status (backlog|in_progress|waiting_client|done),
  priority (high|medium|low), comments, createdAt
}
```

### AppUser
```typescript
{
  id, name, login, password, role (cs|operacional|design|copy|gestao),
  accessLevel (1|2|3), squadIds: string[]
}
```

### Squad
```typescript
{ id, name, leader, members: string[] }
```

### TeamMember
```typescript
{
  id, name, role, squadId?, avatar?,
  completedTasks, avgTime, lateTasks, currentLoad, onTimePct
}
```

---

## 15. Limitações do Protótipo

| Item | Estado Atual | Necessário para Produção |
|------|-------------|-------------------------|
| Persistência de dados | Em memória (Context API) | Banco de dados (PostgreSQL, Supabase, etc.) |
| Autenticação | Validação local contra array | Auth real (JWT, OAuth, Supabase Auth) |
| Upload de contratos | Blob URLs (perde no reload) | Storage (S3, Supabase Storage) |
| Análise de IA | Dados mock fixos | Integração com API de IA (OpenAI, etc.) |
| Exportação de relatórios | Não implementada | PDF/Excel via backend |
| Drag & Drop real no Kanban | Apenas visual (sem persistência de status) | Integrar lib de DnD + update no DB |
| Responsividade mobile | Parcial | Refinar para uso mobile |
| Notificações | Não implementadas | Push/email para prazos, alertas |
| Multi-tenancy | Não existe | Separação por organização/empresa |
| Senhas | Armazenadas em plaintext | Hash (bcrypt) + política de segurança |

---

## Dados de Teste (Mock)

**Arquivo:** `src/data/mockData.ts`

- **3 Squads:** Alpha, Beta, Gamma
- **6 Clientes:** Moda Bella, TechGadgets, Casa & Charme, FitSupply, PetAmor, Calçados Griffe
- **5 Projetos:** vinculados a diferentes clientes
- **8 Tarefas:** variando tipo, status e prioridade
- **8 Membros da Equipe:** com métricas de produtividade

---

*Documento gerado em 24/02/2026 como referência para handoff do protótipo.*
