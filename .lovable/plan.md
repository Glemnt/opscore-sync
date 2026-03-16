

## Plano: Corrigir contagem de ativos nos cards de squads

### Causa raiz

Linhas 223-226 de `ProjectsPage.tsx`: a contagem de "ativos" usa `squadClients` (entidade Cliente) filtrados por `client.status` contendo "ativo". Isso infla o numero porque:
- Um cliente pode ter multiplas plataformas mas e contado apenas uma vez (ou o inverso: clientes sem plataformas no squad sao contados)
- A fonte de verdade operacional e `client_platforms`, nao `clients`

### Correcao em `src/pages/ProjectsPage.tsx`

Substituir a logica de contagem (linhas 214-226) para contar **plataformas** (`clientPlatformsData`) vinculadas ao squad, em vez de clientes:

```typescript
// ANTES (errado — conta clientes)
const activeStatusKeys = clientStatuses
  .filter(s => s.label.toLowerCase().includes('ativo') || s.key === 'active')
  .map(s => s.key);
const activeClients = squadClients.filter(c => activeStatusKeys.includes(c.status)).length;

// DEPOIS (correto — conta plataformas no squad)
const squadCPsAll = clientPlatformsData.filter(cp => cp.squadId === squad.id);
const totalPlatforms = squadCPsAll.length;
// "Ativos" = plataformas que NAO estao em fase de churn/inativo
// (todas as plataformas no squad sao operacionais por padrao)
```

A exibicao mudara de `"{squadClients.length} clientes"` e `"{activeClients} ativos"` para `"{totalPlatforms} plataformas"` com contagem baseada nos registros de `client_platforms`.

A contagem de ativos sera derivada das plataformas reais no squad. Se houver necessidade de distinguir plataformas ativas de inativas, usaremos a `phase` do `client_platforms` (excluindo fases de churn, se existirem).

### Arquivo alterado

`src/pages/ProjectsPage.tsx` — bloco do card de squad (linhas ~214-266)

