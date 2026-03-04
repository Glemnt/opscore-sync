

## Plano: Simplificar geração de demandas e adicionar fluxo aos templates

### Problema atual
1. O dialog de geração mostra campos de responsável e prazo que o usuário não quer nesse momento
2. Apenas 1 template aparece (possível bug de sincronização de estado)
3. Não há como associar um fluxo (workflow) a um template de demanda

### Mudanças

**1. Migração de banco: adicionar coluna `flow_id` na tabela `phase_demand_templates`**
- Nova coluna `flow_id uuid nullable`, com foreign key para `flows(id)` com `ON DELETE SET NULL`
- Permite vincular um fluxo a cada template de demanda

**2. `src/hooks/usePhaseDemandsQuery.ts`**
- Incluir `flow_id` no mapeamento da interface `PhaseDemandTemplate`
- Aceitar `flowId` no `useAddPhaseDemand` e enviar como `flow_id`

**3. `src/components/PhaseDemandConfigDialog.tsx`**
- Adicionar selector de fluxo (opcional) ao formulário de criação de template
- Importar `useFlowsQuery` para listar os fluxos disponíveis
- Exibir nome do fluxo associado nos templates listados

**4. `src/components/GenerateDemandsDialog.tsx`**
- Remover campos de responsável e prazo de cada linha
- Remover imports desnecessários (`Popover`, `Calendar`, `CalendarIcon`, `useAppUsersQuery`, etc.)
- Simplificar `DemandRow` (remover `responsible` e `deadline`)
- Remover validação `allHaveFields` — habilitar botão apenas com seleção
- Corrigir bug de sincronização: usar `useEffect` em vez de comparação manual de `prevIds` dentro do render (causa de mostrar apenas 1 template)
- Na criação das tarefas, definir `responsible: ''` e `deadline: new Date().toISOString()` como valores padrão
- Se o template tiver `flowId`, criar subtarefas automaticamente a partir das etapas do fluxo associado

### Resultado
- Dialog de geração fica limpo: apenas checkbox + título + badge (Cliente/Interna) + nome do fluxo
- Templates configurados com fluxo geram demandas com subtarefas automaticamente
- Todos os templates da fase aparecem corretamente

