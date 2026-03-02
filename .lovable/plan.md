

## Correção: Tela branca na página Demandas

### Causa
O erro `Cannot read properties of undefined (reading 'color')` ocorre no componente `TaskCard` na linha:
```typescript
const typeConf = taskTypeConfig[task.type];
```
Quando uma tarefa tem um `type` que não existe no `taskTypeConfig` (ex: um tipo customizado ou valor inesperado vindo do banco), `typeConf` é `undefined` e ao acessar `typeConf.color` o app quebra.

### Correção

**`src/pages/TasksPage.tsx`** - Adicionar fallback no `TaskCard`:
- Trocar `const typeConf = taskTypeConfig[task.type];` por uma versão com fallback:
  ```typescript
  const typeConf = taskTypeConfig[task.type] ?? { label: task.type, color: 'bg-gray-100 text-gray-700' };
  ```
- Fazer o mesmo para `priorityConf`:
  ```typescript
  const priorityConf = priorityConfig[task.priority] ?? { label: task.priority, className: '', icon: '●' };
  ```

Isso garante que tipos desconhecidos não quebrem a página.

