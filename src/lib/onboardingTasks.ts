export interface OnboardingTaskDef {
  key: string;
  label: string;
  shortLabel: string;
  group: 'd1d3_cs' | 'd2d3_trans' | 'd3d9_aux' | 'd4d9_asst' | 'entrega';
  expectedDay: number;
}

export const ONBOARDING_TASK_GROUPS = [
  { id: 'd1d3_cs', label: 'D1-D3 · CS + Manager', color: 'bg-blue-500/20 text-blue-300' },
  { id: 'd2d3_trans', label: 'D2-D3 · Transição', color: 'bg-indigo-500/20 text-indigo-300' },
  { id: 'd3d9_aux', label: 'D3-D9 · Auxiliar', color: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'd4d9_asst', label: 'D4-D9 · Assistente', color: 'bg-amber-500/20 text-amber-300' },
  { id: 'entrega', label: 'Entrega', color: 'bg-purple-500/20 text-purple-300' },
] as const;

export const ONBOARDING_TASKS: OnboardingTaskDef[] = [
  // D1-D3 CS + Manager
  { key: 'reuniao_onboarding', label: 'Reunião Onboarding OK?', shortLabel: 'Reunião Onb.', group: 'd1d3_cs', expectedDay: 1 },
  { key: 'link_gravacao', label: 'Link da Gravação', shortLabel: 'Link Grav.', group: 'd1d3_cs', expectedDay: 1 },
  { key: 'duracao_reuniao', label: 'Duração (min)', shortLabel: 'Duração', group: 'd1d3_cs', expectedDay: 1 },
  { key: 'briefing_feito', label: 'Briefing Feito?', shortLabel: 'Briefing', group: 'd1d3_cs', expectedDay: 2 },
  { key: 'acessos_ok', label: 'Acessos OK?', shortLabel: 'Acessos', group: 'd1d3_cs', expectedDay: 2 },
  { key: 'cronograma_enviado', label: 'Cronograma Enviado?', shortLabel: 'Cronograma', group: 'd1d3_cs', expectedDay: 2 },
  { key: 'impressora_termica', label: 'Configurar Impressora Térmica', shortLabel: 'Impressora', group: 'd1d3_cs', expectedDay: 3 },
  { key: 'modelo_anuncio', label: 'Criar Modelo de Anúncio?', shortLabel: 'Modelo An.', group: 'd1d3_cs', expectedDay: 3 },
  { key: 'equipe_definida', label: 'Equipe Definida?', shortLabel: 'Equipe', group: 'd1d3_cs', expectedDay: 3 },

  // D2-D3 Transição
  { key: 'kit_entregue', label: 'Kit Entregue? (D2)', shortLabel: 'Kit', group: 'd2d3_trans', expectedDay: 2 },
  { key: 'video1_enviado', label: 'Vídeo 1 Enviado? (D2)', shortLabel: 'Vídeo 1', group: 'd2d3_trans', expectedDay: 2 },
  { key: 'reuniao_implementacao', label: 'Reunião Implementação? (D3)', shortLabel: 'Reunião Impl.', group: 'd2d3_trans', expectedDay: 3 },

  // D3-D9 Auxiliar — Anúncios
  { key: 'anuncios_3', label: '3 Anúncios Publicados (D3)', shortLabel: '3 An.', group: 'd3d9_aux', expectedDay: 3 },
  { key: 'anuncios_7', label: '7 Anúncios Publicados (D4)', shortLabel: '7 An.', group: 'd3d9_aux', expectedDay: 4 },
  { key: 'anuncios_11', label: '11 Anúncios Publicados (D5)', shortLabel: '11 An.', group: 'd3d9_aux', expectedDay: 5 },
  { key: 'termometro_ativo', label: 'Termômetro Ativo? (D5)', shortLabel: 'Termôm.', group: 'd3d9_aux', expectedDay: 5 },
  { key: 'anuncios_15', label: '15 Anúncios Publicados (D6)', shortLabel: '15 An.', group: 'd3d9_aux', expectedDay: 6 },
  { key: 'logistica_ok', label: 'Logística OK? (D6)', shortLabel: 'Logística', group: 'd3d9_aux', expectedDay: 6 },
  { key: 'anuncios_22', label: '22 Anúncios Publicados (D7-D8)', shortLabel: '22 An.', group: 'd3d9_aux', expectedDay: 8 },
  { key: 'anuncios_25', label: '25+ Anúncios Publicados (D9)', shortLabel: '25+ An.', group: 'd3d9_aux', expectedDay: 9 },

  // D4-D9 Assistente
  { key: 'asst_termometro', label: 'Ativar Termômetro (D4)', shortLabel: 'Termôm.', group: 'd4d9_asst', expectedDay: 4 },
  { key: 'asst_promocoes', label: 'Criar Promoções (D6)', shortLabel: 'Promoções', group: 'd4d9_asst', expectedDay: 6 },
  { key: 'asst_envio', label: 'Ativar Envio (D6)', shortLabel: 'Envio', group: 'd4d9_asst', expectedDay: 6 },
  { key: 'asst_campanha', label: 'Criar Campanha (D7)', shortLabel: 'Campanha', group: 'd4d9_asst', expectedDay: 7 },
  { key: 'asst_emissor', label: 'Configurar Emissor (D9)', shortLabel: 'Emissor', group: 'd4d9_asst', expectedDay: 9 },

  // Entrega
  { key: 'reuniao_entrega', label: 'Reunião Entrega (D14)', shortLabel: 'Reunião Ent.', group: 'entrega', expectedDay: 14 },
  { key: 'nps_coletado', label: 'NPS Coletado (D15)', shortLabel: 'NPS', group: 'entrega', expectedDay: 15 },
];

/** Add N business days (skip Sat/Sun) to a date */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

/** Count business days between two dates */
export function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export type SemaforoStatus = 'verde' | 'amarelo' | 'vermelho' | 'azul' | 'preto';

export function computeSemaforo(
  taskStatus: string,
  expectedDay: number,
  clientStartDate: string
): SemaforoStatus {
  if (taskStatus === 'feito') return 'azul';
  if (taskStatus === 'nao_aplica') return 'preto';

  const start = new Date(clientStartDate);
  const deadline = addBusinessDays(start, expectedDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffMs = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'vermelho';
  if (diffDays <= 2) return 'amarelo';
  return 'verde';
}

export function computeOverallSemaforo(
  tasks: OnboardingTaskDef[],
  itemsMap: Record<string, string>,
  clientStartDate: string
): SemaforoStatus {
  const semaforos = tasks.map((t) =>
    computeSemaforo(itemsMap[t.key] || 'pendente', t.expectedDay, clientStartDate)
  );
  if (semaforos.every((s) => s === 'azul' || s === 'preto')) return 'azul';
  if (semaforos.some((s) => s === 'vermelho')) return 'vermelho';
  if (semaforos.some((s) => s === 'amarelo')) return 'amarelo';
  return 'verde';
}
