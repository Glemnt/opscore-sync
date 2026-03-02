

## Adicionar/Editar Fluxo do Cliente na Página de Clientes

### Situação Atual
- A tabela `client_flows` já existe no banco (client_id + flow_id)
- O `TasksContext` tem `clientFlows` mas está hardcoded como `{}` (nunca consulta o banco)
- `assignFlowToClient` cria tarefas a partir do fluxo mas não persiste a associação na tabela `client_flows`
- Não há UI para visualizar ou gerenciar fluxos associados a um cliente

### Alterações

**1. Hook `src/hooks/useClientFlowsQuery.ts`** (novo)
- `useClientFlowsQuery()`: busca todos os registros de `client_flows` com join em `flows` para trazer o nome
- `useAddClientFlow()`: insere na tabela `client_flows`
- `useRemoveClientFlow()`: deleta da tabela `client_flows`

**2. `src/components/ClientDetailModal.tsx`**
- Adicionar seção "Fluxos" entre o grid de informações editáveis e a seção de demandas
- Exibir os fluxos associados ao cliente como chips com botão de remover (X)
- Adicionar botão "+" que abre um dropdown/select com os fluxos disponíveis (vindos de `useFlowsQuery`)
- Ao adicionar um fluxo, persiste na `client_flows` e opcionalmente pergunta se deseja criar as demandas automaticamente

**3. `src/components/AddClientDialog.tsx`**
- Na aba "Fluxo de Demandas", além de selecionar templates para criar tarefas, também persistir a associação do fluxo selecionado na `client_flows` ao criar o cliente

**4. Card do cliente em `ClientsPage.tsx`**
- Exibir badge com o nome do fluxo associado no card do cliente (similar ao badge de plataformas)

### Detalhes técnicos
- O hook `useClientFlowsQuery` retornará `Record<string, string[]>` (clientId → flowIds) para fácil lookup
- A seção de fluxos no modal usará os dados de `useFlowsQuery` para listar opções disponíveis e `useClientFlowsQuery` para mostrar os já associados
- A remoção de fluxo remove apenas a associação, não exclui as tarefas já criadas

