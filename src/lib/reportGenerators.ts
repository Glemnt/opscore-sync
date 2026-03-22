import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, Project, Task, TeamMember, Squad, TaskType, TeamRole } from '@/types';
import { taskTypeConfig, teamRoleConfig, projectTypeConfig, taskStatusConfig, priorityConfig, projectStatusConfig } from '@/lib/config';
import logoImg from '@/assets/logo-grupo-tg.jpg';

const BRAND_COLOR: [number, number, number] = [124, 58, 237]; // #7c3aed
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

  if (logoBase64) {
    doc.addImage(logoBase64, 'JPEG', 14, 8, 30, 15);
  }

  doc.setFontSize(18);
  doc.setTextColor(...BRAND_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text(title, logoBase64 ? 50 : 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  doc.text(`Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, pageWidth - 14, 20, { align: 'right' });

  // Divider line
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.8);
  doc.line(14, 28, pageWidth - 14, 28);

  return 34; // startY after header
}

function addKpiRow(doc: jsPDF, startY: number, kpis: { label: string; value: string }[]) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usable = pageWidth - margin * 2;
  const boxW = usable / kpis.length;
  const boxH = 22;

  kpis.forEach((kpi, i) => {
    const x = margin + i * boxW;
    // Box background
    doc.setFillColor(...BRAND_LIGHT);
    doc.roundedRect(x + 2, startY, boxW - 4, boxH, 3, 3, 'F');

    // Value
    doc.setFontSize(14);
    doc.setTextColor(...BRAND_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x + boxW / 2, startY + 10, { align: 'center' });

    // Label
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

// ===================== 1. TEAM REPORT (by Squad) =====================
export async function generateTeamReport(
  squads: Squad[],
  clients: Client[],
  tasks: Task[],
  projects: Project[],
  teamMembers: TeamMember[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, 'Relatório da Equipe por Squad');

  // Global KPIs
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
    // Check page space
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 20;
    }

    y = addSectionTitle(doc, y, `Squad: ${squad.name} — Líder: ${squad.leader}`);

    // Members table
    const squadMembers = teamMembers.filter(m => squad.members.includes(m.name));
    if (squadMembers.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Colaborador', 'Cargo', 'Tarefas Concluídas', 'Tempo Médio (h)', 'Pontualidade', 'Carga Atual']],
        body: squadMembers.map(m => [
          m.name, roleLabel(m.role), String(m.completedTasks), m.avgTime.toFixed(1), `${m.onTimePct}%`, String(m.currentLoad)
        ]),
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
        alternateRowStyles: { fillColor: GRAY_HEADER },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
    }

    // Squad clients
    const squadClients = clients.filter(c => c.squadId === squad.id);
    if (squadClients.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Cliente', 'Status', 'Projetos Ativos', 'Demandas Pendentes', 'Receita Mensal']],
        body: squadClients.map(c => {
          const activeProj = projects.filter(p => p.clientId === c.id && p.status !== 'done').length;
          const pendingT = tasks.filter(t => t.clientId === c.id && t.status !== 'done').length;
          return [c.name, c.status, String(activeProj), String(pendingT), c.monthlyRevenue ? `R$ ${c.monthlyRevenue.toLocaleString('pt-BR')}` : '—'];
        }),
        theme: 'grid',
        headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
        alternateRowStyles: { fillColor: GRAY_HEADER },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
    }

    // Squad tasks
    const memberNames = squad.members;
    const squadTasks = tasks.filter(t => memberNames.includes(t.responsible));
    if (squadTasks.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Tarefa', 'Tipo', 'Status', 'Responsável', 'Prioridade', 'Prazo']],
        body: squadTasks.map(t => [
          t.title, taskTypeLabel(t.type), statusLabel(t.status), t.responsible, priorityLabel(t.priority), new Date(t.deadline).toLocaleDateString('pt-BR')
        ]),
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

// ===================== 2. CLIENT REPORT =====================
export async function generateClientReport(client: Client, tasks: Task[], projects: Project[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, `Relatório do Cliente: ${client.name}`);

  const clientTasks = tasks.filter(t => t.clientId === client.id);
  const clientProjects = projects.filter(p => p.clientId === client.id);
  const doneTasks = clientTasks.filter(t => t.status === 'done').length;
  const healthMap = { green: '🟢 Saudável', yellow: '🟡 Atenção', red: '🔴 Crítico', white: '⚪ Sem dados' };

  y = addKpiRow(doc, y, [
    { label: 'Receita Mensal', value: client.monthlyRevenue ? `R$ ${client.monthlyRevenue.toLocaleString('pt-BR')}` : '—' },
    { label: 'Projetos Ativos', value: String(client.activeProjects) },
    { label: 'Demandas Pendentes', value: String(client.pendingTasks) },
    { label: 'Tarefas Concluídas', value: String(doneTasks) },
    { label: 'Saúde', value: healthMap[client.healthColor || 'white'] },
  ]);

  // Info row
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Empresa: ${client.companyName} | Segmento: ${client.segment} | Responsável: ${client.responsible} | Contrato: ${client.contractType.toUpperCase()} | Dia pgto: ${client.paymentDay}`, 14, y);
  y += 8;

  // Projects table
  if (clientProjects.length > 0) {
    y = addSectionTitle(doc, y, 'Projetos');
    autoTable(doc, {
      startY: y,
      head: [['Projeto', 'Tipo', 'Status', 'Progresso', 'Responsável', 'Prazo']],
      body: clientProjects.map(p => [
        p.name, projectTypeLabel(p.type), statusLabel(p.status), `${p.progress}%`, p.responsible, new Date(p.deadline).toLocaleDateString('pt-BR')
      ]),
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: GRAY_HEADER },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Tasks table
  if (clientTasks.length > 0) {
    y = addSectionTitle(doc, y, 'Tarefas');
    autoTable(doc, {
      startY: y,
      head: [['Tarefa', 'Responsável', 'Tipo', 'Status', 'Prioridade', 'Estimado (h)', 'Real (h)', 'Prazo']],
      body: clientTasks.map(t => [
        t.title, t.responsible, taskTypeLabel(t.type), statusLabel(t.status), priorityLabel(t.priority),
        t.estimatedTime.toFixed(1), t.realTime ? t.realTime.toFixed(1) : '—', new Date(t.deadline).toLocaleDateString('pt-BR')
      ]),
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

// ===================== 3. TASK TYPE REPORT =====================
export async function generateTaskTypeReport(
  taskType: TaskType,
  tasks: Task[],
  config: typeof taskTypeConfig
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const typeLabel = config[taskType]?.label || taskType;
  let y = await addHeader(doc, `Relatório por Tipo de Tarefa: ${typeLabel}`);

  const typeTasks = tasks.filter(t => t.type === taskType);
  const done = typeTasks.filter(t => t.status === 'done').length;
  const inProgress = typeTasks.filter(t => t.status === 'in_progress').length;
  const avgEstimated = typeTasks.length > 0 ? (typeTasks.reduce((a, t) => a + t.estimatedTime, 0) / typeTasks.length).toFixed(1) : '0';
  const tasksWithReal = typeTasks.filter(t => t.realTime);
  const avgReal = tasksWithReal.length > 0 ? (tasksWithReal.reduce((a, t) => a + (t.realTime || 0), 0) / tasksWithReal.length).toFixed(1) : '—';

  y = addKpiRow(doc, y, [
    { label: 'Total de Tarefas', value: String(typeTasks.length) },
    { label: 'Concluídas', value: String(done) },
    { label: 'Em Andamento', value: String(inProgress) },
    { label: 'Tempo Médio Estimado (h)', value: avgEstimated },
    { label: 'Tempo Médio Real (h)', value: avgReal },
  ]);

  if (typeTasks.length > 0) {
    y = addSectionTitle(doc, y, `Todas as tarefas — ${typeLabel}`);
    autoTable(doc, {
      startY: y,
      head: [['Tarefa', 'Cliente', 'Responsável', 'Status', 'Prioridade', 'Estimado (h)', 'Real (h)', 'Prazo']],
      body: typeTasks.map(t => [
        t.title, t.clientName, t.responsible, statusLabel(t.status), priorityLabel(t.priority),
        t.estimatedTime.toFixed(1), t.realTime ? t.realTime.toFixed(1) : '—', new Date(t.deadline).toLocaleDateString('pt-BR')
      ]),
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

// ===================== 4. COLLABORATOR REPORT =====================
export async function generateCollaboratorReport(
  member: TeamMember,
  tasks: Task[],
  config: typeof teamRoleConfig
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addHeader(doc, `Performance: ${member.name}`);

  y = addKpiRow(doc, y, [
    { label: 'Cargo', value: config[member.role]?.label || member.role },
    { label: 'Tarefas Concluídas', value: String(member.completedTasks) },
    { label: 'Tempo Médio (h)', value: member.avgTime.toFixed(1) },
    { label: 'Pontualidade', value: `${member.onTimePct}%` },
    { label: 'Tarefas Atrasadas', value: String(member.lateTasks) },
    { label: 'Carga Atual', value: String(member.currentLoad) },
  ]);

  const memberTasks = tasks.filter(t => t.responsible === member.name);

  if (memberTasks.length > 0) {
    y = addSectionTitle(doc, y, 'Tarefas Atribuídas');
    autoTable(doc, {
      startY: y,
      head: [['Tarefa', 'Cliente', 'Tipo', 'Status', 'Prioridade', 'Prazo', 'Estimado (h)', 'Real (h)']],
      body: memberTasks.map(t => [
        t.title, t.clientName, taskTypeLabel(t.type), statusLabel(t.status), priorityLabel(t.priority),
        new Date(t.deadline).toLocaleDateString('pt-BR'), t.estimatedTime.toFixed(1), t.realTime ? t.realTime.toFixed(1) : '—'
      ]),
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
