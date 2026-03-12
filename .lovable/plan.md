

## Problema

O filtro de responsável na página de Squads (linha 402) verifica apenas `e.cp.responsible` (responsável da plataforma). Se o responsável está definido apenas no nível do cliente (`e.client.responsible`) e não na plataforma, o filtro não encontra correspondência.

Da mesma forma, a lista de responsáveis disponíveis no dropdown (linha 397) só coleta responsáveis de `e.cp.responsible`, ignorando `e.client.responsible`.

## Solução

### Alteração em `src/pages/ProjectsPage.tsx`

**Linha 397** - Incluir responsáveis do cliente na lista do dropdown:
```typescript
const uniqueResponsibles = [...new Set(
  squadPlatformEntries.flatMap((e) => [e.cp.responsible, e.client.responsible]).filter(Boolean)
)];
```

**Linha 402** - Alterar o filtro para considerar ambos os níveis:
```typescript
const matchResponsible = squadResponsibleFilter === 'all' 
  || e.cp.responsible === squadResponsibleFilter 
  || e.client.responsible === squadResponsibleFilter;
```

Sem alterações de banco de dados.

