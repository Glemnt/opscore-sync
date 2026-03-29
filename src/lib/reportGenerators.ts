import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, Project, Task, TeamMember, Squad, TaskType, TeamRole } from '@/types';
import { taskTypeConfig, teamRoleConfig, projectTypeConfig, taskStatusConfig, priorityConfig, projectStatusConfig } from '@/lib/config';
import type { ClientPlatform } from '@/hooks/useClientPlatformsQuery';
import type { HealthResult } from '@/lib/healthScore';
import logoImg from '@/assets/logo-grupo-tg.jpg';

const BRAND_COLOR: [number, number, number] = [124, 58, 237];
const BRAND_LIGHT: [number, number, number] = [245, 240, 255];
const GRAY_HEADER: [number, number, number] = [249, 250, 251];
const TEXT_DARK: [number, number, number] = [30, 30, 30];
const TEXT_MUTED: [number, number, number] = [120, 120, 120];

function loadLogoAsBase64(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve('');
    img.src = logoImg;
  });
}

async function addHeader(doc: jsPDF, title: string) {
  const logoBase64 = await loadLogoAsBase64();
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logoBase64) doc.addImage(logoBase64, 'JPEG', 14, 8, 30, 15);

  doc.setFontSize(18);
  doc.setTextColor(...BRAND_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text(title, logoBase64 ? 50 : 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  doc.text(`Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, pageWidth - 14, 20, { align: 'right' });

  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.8);
  doc.line(14, 28, pageWidth - 14, 28);

  return 34;
}

function addKpiRow(doc: jsPDF, startY: number, kpis: { label: string; value: string }[]) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usable = pageWidth - margin * 2;
  const boxW = usable / kpis.length;
  const boxH = 22;

  kpis.forEach((kpi, i) => {
    const x = margin + i * boxW;
    doc.setFillColor(...BRAND_LIGHT);
    doc.roundedRect(x + 2, startY, boxW - 4, boxH, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setTextColor(...BRAND_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x + boxW / 2, startY + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, x + boxW / 2, startY + 17, { align: 'center' });
  });

  return startY + boxH + 6;
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  return y + 6;
}

function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    doc.text('Grupo TG — Confidencial', 14, doc.internal.pageSize.getHeight() - 8);
  }
}

const statusLabel = (s: string) => taskStatusConfig[s as keyof typeof taskStatusConfig]?.label || s;
const priorityLabel = (p: string) => priorityConfig[p as keyof typeof priorityConfig]?.label || p;
const taskTypeLabel = (t: string) => taskTypeConfig[t as keyof typeof taskTypeConfig]?.label || t;
const projectTypeLabel = (t: string) => projectTypeConfig[t as keyof typeof projectTypeConfig]?.label || t;
const roleLabel = (r: string) => teamRoleConfig[r as keyof typeof teamRoleConfig]?.label || r;

// ─── CSV Utility ───
export function downloadCsv(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(';'),
    ...rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ===================== LEGACY REPORTS (kept for backwards compat) =====================

export async function generateTeamReport(
  squads: Squad[], clients: Client[], tasks: Task[], projects: Project[], teamMembers: TeamMember[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, 'Relatório da Equipe por Squad');
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const avgTime = teamMembers.length > 0 ? (teamMembers.reduce((a, m) => a + m.avgTime, 0) / teamMembers.length).toFixed(1) : '0';
  const avgOnTime = teamMembers.length > 0 ? (teamMembers.reduce((a, m) => a + m.onTimePct, 0) / teamMembers.length).toFixed(0) : '0';
  y = addKpiRow(doc, y, [
    { label: 'Total de Tarefas', value: String(totalTasks) },
    { label: 'Concluídas', value: String(doneTasks) },
    { label: 'Tempo Médio (h)', value: avgTime },
    { label: 'Pontualidade Média', value: `${avgOnTime}%` },
    { label: 'Colaboradores', value: String(teamMembers.length) },
  ]);
  for (const squad of squads) {
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, y, `Squad: ${squad.name} — Líder: ${squad.leader}`);
    const squadMembers = teamMembers.filter(m => squad.members.includes(m.name));
    if (squadMembers.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Colaborador', 'Cargo', 'Concluídas', 'Tempo Médio (h)', 'Pontualidade', 'Carga']],
        body: squadMembers.map(m => [m.name, roleLabel(m.role), String(m.completedTasks), m.avgTime.toFixed(1), `${m.onTimePct}%`, String(m.currentLoad)]),
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
        alternateRowStyles: { fillColor: GRAY_HEADER },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }
  addPageNumbers(doc);
  doc.save('relatorio-equipe-squads.pdf');
}

export async function generateClientReport(client: Client, tasks: Task[], projects: Project[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, `Relatório do Cliente: ${client.name}`);
  const clientTasks = tasks.filter(t => t.clientId === client.id);
  const clientProjects = projects.filter(p => p.clientId === client.id);
  const doneTasks = clientTasks.filter(t => t.status === 'done').length;
  const healthMap: Record<string, string> = { green: 'Saudável', yellow: 'Atenção', red: 'Crítico', white: 'Sem dados' };
  y = addKpiRow(doc, y, [
    { label: 'Receita Mensal', value: client.monthlyRevenue ? `R$ ${client.monthlyRevenue.toLocaleString('pt-BR')}` : '—' },
    { label: 'Projetos Ativos', value: String(clientProjects.filter(p => p.status !== 'done').length) },
    { label: 'Pendentes', value: String(clientTasks.filter(t => t.status !== 'done').length) },
    { label: 'Concluídas', value: String(doneTasks) },
    { label: 'Saúde', value: healthMap[client.healthColor || 'white'] },
  ]);
  if (clientTasks.length > 0) {
    y = addSectionTitle(doc, y, 'Tarefas');
    autoTable(doc, {
      startY: y,
      head: [['Tarefa', 'Responsável', 'Tipo', 'Status', 'Prioridade', 'Prazo']],
      body: clientTasks.map(t => [t.title, t.responsible, taskTypeLabel(t.type), statusLabel(t.status), priorityLabel(t.priority), new Date(t.deadline).toLocaleDateString('pt-BR')]),
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: GRAY_HEADER },
      margin: { left: 14, right: 14 },
    });
  }
  addPageNumbers(doc);
  doc.save(`relatorio-cliente-${client.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

export async function generateTaskTypeReport(taskType: TaskType, tasks: Task[], config: typeof taskTypeConfig) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const typeLabel = config[taskType]?.label || taskType;
  let y = await addHeader(doc, `Relatório por Tipo de Tarefa: ${typeLabel}`);
  const typeTasks = tasks.filter(t => t.type === taskType);
  const done = typeTasks.filter(t => t.status === 'done').length;
  y = addKpiRow(doc, y, [
    { label: 'Total', value: String(typeTasks.length) },
    { label: 'Concluídas', value: String(done) },
    { label: 'Em Andamento', value: String(typeTasks.filter(t => t.status === 'in_progress').length) },
  ]);
  if (typeTasks.length > 0) {
    y = addSectionTitle(doc, y, `Todas — ${typeLabel}`);
    autoTable(doc, {
      startY: y,
      head: [['Tarefa', 'Cliente', 'Responsável', 'Status', 'Prazo']],
      body: typeTasks.map(t => [t.title, t.clientName, t.responsible, statusLabel(t.status), new Date(t.deadline).toLocaleDateString('pt-BR')]),
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: GRAY_HEADER },
      margin: { left: 14, right: 14 },
    });
  }
  addPageNumbers(doc);
  doc.save(`relatorio-tipo-${taskType}.pdf`);
}

export async function generateCollaboratorReport(member: TeamMember, tasks: Task[], config: typeof teamRoleConfig) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, `Performance: ${member.name}`);
  y = addKpiRow(doc, y, [
    { label: 'Cargo', value: config[member.role]?.label || member.role },
    { label: 'Concluídas', value: String(member.completedTasks) },
    { label: 'Pontualidade', value: `${member.onTimePct}%` },
    { label: 'Atrasadas', value: String(member.lateTasks) },
  ]);
  const memberTasks = tasks.filter(t => t.responsible === member.name);
  if (memberTasks.length > 0) {
    y = addSectionTitle(doc, y, 'Tarefas Atribuídas');
    autoTable(doc, {
      startY: y,
      head: [['Tarefa', 'Cliente', 'Tipo', 'Status', 'Prazo']],
      body: memberTasks.map(t => [t.title, t.clientName, taskTypeLabel(t.type), statusLabel(t.status), new Date(t.deadline).toLocaleDateString('pt-BR')]),
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: GRAY_HEADER },
      margin: { left: 14, right: 14 },
    });
  }
  addPageNumbers(doc);
  doc.save(`relatorio-colaborador-${member.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

// ===================== NEW REPORTS =====================

export async function generateOperationReport(
  clients: Client[],
  platforms: ClientPlatform[],
  tasks: Task[],
  platformCatalog: { slug: string; name: string }[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, 'Relatório de Operação');

  const now = new Date();
  const delayed = platforms.filter(p => p.deadline && new Date(p.deadline) < now && p.phase !== 'performance');

  y = addKpiRow(doc, y, [
    { label: 'Clientes Ativos', value: String(clients.length) },
    { label: 'Total Plataformas', value: String(platforms.length) },
    { label: 'Plataformas Atrasadas', value: String(delayed.length) },
    { label: 'Tarefas no Período', value: String(tasks.length) },
  ]);

  // Clients by phase
  const phaseMap: Record<string, number> = {};
  clients.forEach(c => { phaseMap[c.faseMacro || 'implementacao'] = (phaseMap[c.faseMacro || 'implementacao'] || 0) + 1; });
  y = addSectionTitle(doc, y, 'Clientes por Fase');
  autoTable(doc, {
    startY: y,
    head: [['Fase', 'Quantidade']],
    body: Object.entries(phaseMap).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, String(v)]),
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: GRAY_HEADER },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Platforms by consultant
  if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 20; }
  const consultMap: Record<string, number> = {};
  platforms.forEach(p => { if (p.responsible) consultMap[p.responsible] = (consultMap[p.responsible] || 0) + 1; });
  y = addSectionTitle(doc, y, 'Plataformas por Consultor');
  autoTable(doc, {
    startY: y,
    head: [['Consultor', 'Plataformas', 'Atrasadas']],
    body: Object.entries(consultMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => {
      const late = delayed.filter(p => p.responsible === name).length;
      return [name, String(count), String(late)];
    }),
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: GRAY_HEADER },
    margin: { left: 14, right: 14 },
  });

  addPageNumbers(doc);
  doc.save('relatorio-operacao.pdf');
}

export async function generateTeamPerformanceReport(
  tasks: Task[],
  appUsers: { name: string; role: string }[],
  doneTasks: Task[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, 'Relatório de Performance da Equipe');

  const now = new Date();
  const overdue = tasks.filter(t => t.status !== 'done' && new Date(t.deadline) < now);

  y = addKpiRow(doc, y, [
    { label: 'Tarefas no Período', value: String(tasks.length) },
    { label: 'Concluídas', value: String(doneTasks.length) },
    { label: 'Atrasadas', value: String(overdue.length) },
    { label: 'Colaboradores', value: String(appUsers.length) },
  ]);

  // Done by collaborator
  const doneMap: Record<string, number> = {};
  doneTasks.forEach(t => { doneMap[t.responsible] = (doneMap[t.responsible] || 0) + 1; });
  y = addSectionTitle(doc, y, 'Tarefas Concluídas por Colaborador');
  autoTable(doc, {
    startY: y,
    head: [['Colaborador', 'Concluídas', 'Atrasadas', 'Rejeições']],
    body: Object.entries(doneMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => {
      const late = overdue.filter(t => t.responsible === name).length;
      const rejections = tasks.filter(t => t.responsible === name).reduce((s, t) => s + (t.rejectionCount || 0), 0);
      return [name, String(count), String(late), String(rejections)];
    }),
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: GRAY_HEADER },
    margin: { left: 14, right: 14 },
  });

  addPageNumbers(doc);
  doc.save('relatorio-equipe-performance.pdf');
}

export async function generateClientDetailedReport(
  client: Client,
  tasks: Task[],
  platforms: ClientPlatform[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, `Relatório Detalhado: ${client.name}`);

  const done = tasks.filter(t => t.status === 'done').length;
  const open = tasks.length - done;
  const healthMap: Record<string, string> = { green: 'Saudável', yellow: 'Atenção', red: 'Crítico', white: 'Sem dados' };

  y = addKpiRow(doc, y, [
    { label: 'Tarefas Abertas', value: String(open) },
    { label: 'Concluídas', value: String(done) },
    { label: 'Plataformas', value: String(platforms.length) },
    { label: 'Risco Churn', value: client.riscoChurn || 'baixo' },
    { label: 'Saúde', value: healthMap[client.healthColor || 'white'] },
  ]);

  // Platforms
  if (platforms.length > 0) {
    y = addSectionTitle(doc, y, 'Plataformas');
    autoTable(doc, {
      startY: y,
      head: [['Plataforma', 'Fase', 'Status', 'Responsável', 'Prazo']],
      body: platforms.map(p => [p.platformSlug, p.phase, p.platformStatus, p.responsible, p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : '—']),
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: GRAY_HEADER },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Tasks
  if (tasks.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, y, 'Tarefas');
    autoTable(doc, {
      startY: y,
      head: [['Tarefa', 'Responsável', 'Tipo', 'Status', 'Prazo']],
      body: tasks.map(t => [t.title, t.responsible, taskTypeLabel(t.type), statusLabel(t.status), new Date(t.deadline).toLocaleDateString('pt-BR')]),
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: GRAY_HEADER },
      margin: { left: 14, right: 14 },
    });
  }

  addPageNumbers(doc);
  doc.save(`relatorio-detalhado-${client.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

export async function generateExecutiveReport(
  clients: Client[],
  platforms: ClientPlatform[],
  tasks: Task[],
  healthScores: Record<string, HealthResult>,
  platformCatalog: { slug: string; name: string }[],
  npsData: { score: number | null; promoters: number; detractors: number; passives: number; total: number }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, 'Relatório Executivo');

  const backlog = tasks.filter(t => t.status === 'backlog').length;
  const mrr = clients.reduce((s, c) => s + (c.monthlyRevenue || 0), 0);
  const healthDist = { green: 0, yellow: 0, red: 0, white: 0 };
  clients.forEach(c => {
    const hs = healthScores[c.id];
    if (hs) healthDist[hs.color] = (healthDist[hs.color] || 0) + 1;
    else healthDist.white += 1;
  });

  y = addKpiRow(doc, y, [
    { label: 'Clientes Ativos', value: String(clients.length) },
    { label: 'Backlog Total', value: String(backlog) },
    { label: 'MRR Total', value: `R$ ${mrr.toLocaleString('pt-BR')}` },
    { label: 'NPS Score', value: npsData.score != null ? String(npsData.score) : '—' },
  ]);

  // Health distribution
  y = addSectionTitle(doc, y, 'Saúde da Carteira');
  autoTable(doc, {
    startY: y,
    head: [['Classificação', 'Quantidade', '%']],
    body: [
      ['Saudável (80-100)', String(healthDist.green), clients.length ? `${Math.round(healthDist.green / clients.length * 100)}%` : '0%'],
      ['Atenção (50-79)', String(healthDist.yellow), clients.length ? `${Math.round(healthDist.yellow / clients.length * 100)}%` : '0%'],
      ['Crítico (0-49)', String(healthDist.red), clients.length ? `${Math.round(healthDist.red / clients.length * 100)}%` : '0%'],
      ['Sem dados', String(healthDist.white), clients.length ? `${Math.round(healthDist.white / clients.length * 100)}%` : '0%'],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: GRAY_HEADER },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Churn risk
  const churnRisk = clients.filter(c => c.riscoChurn === 'alto' || c.riscoChurn === 'critico');
  if (churnRisk.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, y, 'Clientes em Risco de Churn');
    autoTable(doc, {
      startY: y,
      head: [['Cliente', 'Risco', 'Responsável', 'MRR', 'Fase']],
      body: churnRisk.map(c => [c.name, c.riscoChurn || '', c.responsible, c.monthlyRevenue ? `R$ ${c.monthlyRevenue.toLocaleString('pt-BR')}` : '—', c.faseMacro || '']),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: GRAY_HEADER },
      margin: { left: 14, right: 14 },
    });
  }

  addPageNumbers(doc);
  doc.save('relatorio-executivo.pdf');
}
