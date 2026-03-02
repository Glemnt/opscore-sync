

## Correção: Página branca ao abrir cliente "Teste"

### Causa raiz
O componente `TimelineItem` em `ClientDetailModal.tsx` (linha 451) acessa `taskTypeConfig[task.type]` sem fallback. Quando uma demanda tem um tipo customizado (criado pelo usuário e salvo no banco), ele não existe no `taskTypeConfig` estático, resultando em `undefined`. Na linha 466, `typeConf.color` crasheia a aplicação inteira.

### Alteração

**`src/components/ClientDetailModal.tsx`** — componente `TimelineItem` (linha 451)

Substituir:
```typescript
const typeConf = taskTypeConfig[task.type];
```

Por uso do hook `useTaskTypesMap` (já usado em `TasksPage.tsx`) com fallback seguro:
```typescript
const typesMap = useTaskTypesMap();
const typeConf = taskTypeConfig[task.type] ?? typesMap[task.type] ?? { label: task.type, color: 'bg-muted text-muted-foreground' };
```

Isso garante que tipos customizados do banco são resolvidos corretamente, e qualquer tipo desconhecido recebe um fallback visual em vez de crashear.

