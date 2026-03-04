

## Plano: Corrigir crash do modal de cliente (TimelineItem)

### Problema
O componente `TimelineItem` em `ClientDetailModal.tsx` (linha 742) faz `taskStatusConfig[task.status]` sem verificar se o status existe no mapa. O tipo `TaskStatus` permite valores arbitrários (`string & {}`), mas `taskStatusConfig` só tem 4 entradas fixas (`backlog`, `in_progress`, `waiting_client`, `done`). Quando uma task tem um status customizado (ex: nome de fase de pipeline), `statusConf` retorna `undefined` e o acesso a `statusConf.className` na linha 756 causa um `TypeError`, quebrando toda a renderização do modal.

### Correção

**Arquivo: `src/components/ClientDetailModal.tsx`**

Na linha 742, adicionar fallback para quando o status não existe no config:

```typescript
const statusConf = taskStatusConfig[task.status as TaskStatus] ?? { 
  label: task.status, 
  className: 'bg-muted text-muted-foreground' 
};
```

Isso garante que qualquer status desconhecido será exibido com o próprio nome como label e um estilo neutro, em vez de crashar o componente.

### Resultado
O modal do cliente voltará a abrir corretamente, e após a correção poderemos testar o calendário conforme solicitado.

