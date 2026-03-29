import { differenceInDays, parseISO, isValid } from 'date-fns';
import type { Client, Task } from '@/types';
import type { AppUserProfile } from '@/types/database';

export interface HealthBreakdown {
  tasksScore: number;
  platformsScore: number;
  responseTimeScore: number;
  deadlineScore: number;
  blocksScore: number;
  financeScore: number;
  npsScore: number;
}

export interface HealthResult {
  score: number;
  color: 'green' | 'yellow' | 'red' | 'white';
  breakdown: HealthBreakdown;
  hasSufficientData: boolean;
}

export interface ClientPlatformLike {
  clientId: string;
  phase: string;
  dependeCliente: boolean;
  platformStatus: string;
  deadline?: string | null;
  dataPrevistaPassagem?: string | null;
}

const WEIGHTS = {
  tasks: 0.25,
  platforms: 0.20,
  responseTime: 0.15,
  deadline: 0.15,
  blocks: 0.10,
  finance: 0.10,
  nps: 0.05,
};

export function calculateHealthScore(
  client: Client,
  clientTasks: Task[],
  clientPlatforms: ClientPlatformLike[]
): HealthResult {
  const today = new Date();
  let dataPoints = 0;

  // 1. Tarefas atrasadas (25%)
  const totalTasks = clientTasks.filter(t => t.status !== 'done').length;
  const overdueTasks = clientTasks.filter(t => {
    if (t.status === 'done') return false;
    const d = parseISO(t.deadline);
    return isValid(d) && d < today;
  }).length;
  const tasksScore = totalTasks > 0
    ? (1 - Math.min(overdueTasks / totalTasks, 1)) * 100
    : 100;
  if (totalTasks > 0) dataPoints++;

  // 2. Plataformas travadas (20%)
  const totalPlatforms = clientPlatforms.length;
  const stuckPlatforms = clientPlatforms.filter(p =>
    p.dependeCliente || p.platformStatus === 'bloqueada' || p.platformStatus === 'aguardando_cliente'
  ).length;
  const platformsScore = totalPlatforms > 0
    ? (1 - Math.min(stuckPlatforms / totalPlatforms, 1)) * 100
    : 100;
  if (totalPlatforms > 0) dataPoints++;

  // 3. Tempo sem resposta (15%)
  let responseTimeScore = 50; // default sem dado
  if (client.ultimaRespostaCliente) {
    const d = parseISO(client.ultimaRespostaCliente);
    if (isValid(d)) {
      const days = differenceInDays(today, d);
      responseTimeScore = Math.max(0, Math.min(100, (1 - days / 7) * 100));
      dataPoints++;
    }
  }

  // 4. Prazo estourado (15%)
  let deadlineScore = 100;
  if (client.dataPrevistaPassagem) {
    const d = parseISO(client.dataPrevistaPassagem);
    if (isValid(d)) {
      deadlineScore = d < today ? 0 : 100;
      dataPoints++;
    }
  }

  // 5. Bloqueios ativos (10%)
  const blockedTasks = clientTasks.filter(t =>
    t.status !== 'done' && (t.dependeCliente || t.aguardandoCliente)
  ).length;
  const blocksScore = totalTasks > 0
    ? (1 - Math.min(blockedTasks / totalTasks, 1)) * 100
    : 100;

  // 6. Risco financeiro (10%)
  const financeMap: Record<string, number> = { em_dia: 100, atrasado: 30, inadimplente: 0 };
  const financeScore = financeMap[client.statusFinanceiro ?? 'em_dia'] ?? 100;
  if (client.statusFinanceiro) dataPoints++;

  // 7. NPS (5%)
  let npsScore = 50;
  if (client.npsUltimo != null) {
    npsScore = Math.min(100, (client.npsUltimo / 10) * 100);
    dataPoints++;
  }

  const hasSufficientData = dataPoints >= 2;

  const score = Math.round(
    tasksScore * WEIGHTS.tasks +
    platformsScore * WEIGHTS.platforms +
    responseTimeScore * WEIGHTS.responseTime +
    deadlineScore * WEIGHTS.deadline +
    blocksScore * WEIGHTS.blocks +
    financeScore * WEIGHTS.finance +
    npsScore * WEIGHTS.nps
  );

  let color: HealthResult['color'];
  if (!hasSufficientData) color = 'white';
  else if (score >= 80) color = 'green';
  else if (score >= 50) color = 'yellow';
  else color = 'red';

  return {
    score,
    color,
    breakdown: {
      tasksScore: Math.round(tasksScore),
      platformsScore: Math.round(platformsScore),
      responseTimeScore: Math.round(responseTimeScore),
      deadlineScore: Math.round(deadlineScore),
      blocksScore: Math.round(blocksScore),
      financeScore: Math.round(financeScore),
      npsScore: Math.round(npsScore),
    },
    hasSufficientData,
  };
}

export function canViewHealth(user: AppUserProfile | null): boolean {
  if (!user) return false;
  if (user.accessLevel >= 2) return true;
  if (user.role === 'cs') return true;
  return false;
}

export const HEALTH_LABELS: Record<string, string> = {
  green: 'Saudável',
  yellow: 'Atenção',
  red: 'Crítico',
  white: 'Não avaliado',
};

export const HEALTH_ICONS: Record<string, string> = {
  green: '🟢',
  yellow: '🟡',
  red: '🔴',
  white: '⚪',
};

export const BREAKDOWN_LABELS: Record<keyof HealthBreakdown, string> = {
  tasksScore: 'Tarefas no prazo',
  platformsScore: 'Plataformas ativas',
  responseTimeScore: 'Tempo de resposta',
  deadlineScore: 'Prazos gerais',
  blocksScore: 'Sem bloqueios',
  financeScore: 'Saúde financeira',
  npsScore: 'NPS',
};

export const BREAKDOWN_WEIGHTS: Record<keyof HealthBreakdown, number> = {
  tasksScore: 25,
  platformsScore: 20,
  responseTimeScore: 15,
  deadlineScore: 15,
  blocksScore: 10,
  financeScore: 10,
  npsScore: 5,
};
