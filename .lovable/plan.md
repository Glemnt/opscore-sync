

## Fix: Labels em Português nos Gráficos de Fases

### Problema
`clientsByPhase` (linha 245) e `platformsByPhase` (linha 251) usam chaves brutas do banco como labels nos gráficos.

### Correção em `src/pages/ReportsPage.tsx`

**1. Criar mapa `phaseLabels`** no topo do componente (ou fora dele como constante):

```typescript
const phaseLabels: Record<string, string> = {
  onboarding: 'Onboarding',
  onboard: 'Onboard',
  implementacao: 'Implementação',
  implementacao_ativa: 'Implementação Ativa',
  validacao_final: 'Validação Final',
  performance: 'Performance',
  escala: 'Escala',
  active: 'Ativo',
  paused: 'Pausado',
  pausado: 'Pausado',
  chur