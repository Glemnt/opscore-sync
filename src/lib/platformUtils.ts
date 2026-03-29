import type { ClientPlatform } from '@/hooks/useClientPlatformsQuery';

export type FaseMacroCalc = 'implementacao' | 'performance' | 'escala' | 'pausado' | 'cancelado';

const IMPL_STATUSES = ['nao_iniciada', 'onboard', 'implementacao_ativa', 'aguardando_cliente', 'bloqueada', 'pronta_performance'];
const PERF_STATUSES = ['em_performance', 'escalada'];
const SCALE_STATUSES = ['escalada'];
const INACTIVE_STATUSES = ['pausada', 'cancelada'];

export function computeClientFaseMacro(platforms: ClientPlatform[]): FaseMacroCalc {
  if (platforms.length === 0) return 'implementacao';

  const statuses = platforms.map(p => p.platformStatus);

  const allInactive = statuses.every(s => INACTIVE_STATUSES.includes(s));
  if (allInactive) {
    return statuses.every(s => s === 'cancelada') ? 'cancelado' : 'pausado';
  }

  const active = statuses.filter(s => !INACTIVE_STATUSES.includes(s));

  if (active.every(s => SCALE_STATUSES.includes(s))) return 'escala';
  if (active.every(s => PERF_STATUSES.includes(s))) return 'performance';
  return 'implementacao';
}

export function computeDiasEmAtraso(deadline: string | null): number {
  if (!deadline) return 0;
  const diff = Math.floor((Date.now() - new Date(deadline).getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export const PLATFORM_STATUS_OPTIONS = [
  { value: 'nao_iniciada', label: 'Não Iniciada', color: 'bg-muted text-muted-foreground' },
  { value: 'onboard', label: 'Onboard', color: 'bg-blue-100 text-blue-700' },
  { value: 'implementacao_ativa', label: 'Implementação Ativa', color: 'bg-amber-100 text-amber-700' },
  { value: 'aguardando_cliente', label: 'Aguardando Cliente', color: 'bg-orange-100 text-orange-700' },
  { value: 'bloqueada', label: 'Bloqueada', color: 'bg-red-100 text-red-700' },
  { value: 'pronta_performance', label: 'Pronta p/ Performance', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'em_performance', label: 'Em Performance', color: 'bg-green-100 text-green-700' },
  { value: 'escalada', label: 'Escalada', color: 'bg-purple-100 text-purple-700' },
  { value: 'pausada', label: 'Pausada', color: 'bg-gray-100 text-gray-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-50 text-red-400' },
] as const;

export const MOTIVO_ATRASO_OPTIONS = [
  'Aguardando documentação do cliente',
  'Aguardando aprovação da plataforma',
  'Problemas técnicos',
  'Falta de estoque/produto',
  'Cliente não responde',
  'Equipe sobrecarregada',
  'Dependência de terceiros',
  'Outro',
] as const;
