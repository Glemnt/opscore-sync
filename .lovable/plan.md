

## Plano: Kanban de Fases das Plataformas na Página Squads

### Objetivo
Reorganizar a visualização das plataformas de um cliente (step 2.5 do `ProjectsPage.tsx`) de um grid de cards para um **Kanban horizontal**, onde as colunas representam as fases (onboarding, implementacao, escala, performance, etc.) e os cards são as plataformas do cliente posicionadas na coluna correspondente à sua fase atual.

### Lógica
- As colunas do Kanban serão derivadas da tabela `client_statuses` (já carregada via `useClientStatusesQuery`)
- Cada plataforma do cliente (`client_platforms`) tem um campo `phase` que determina em qual coluna ela aparece
- O card de cada plataforma mantém as informações atuais (squad, responsável, contrato, atributos operacionais, indicador de reputação)
- O card "Ver Todos" permanece acima do Kanban como botão de ação

### Alterações

**Arquivo: `src/pages/ProjectsPage.tsx` (linhas 541-673)**

Substituir o layout `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4` por um layout Kanban horizontal:

1. Agrupar as plataformas do cliente por `cp.phase`
2. Renderizar colunas horizontais (uma por fase existente) com header mostrando o nome da fase e contagem
3. Dentro de cada coluna, renderizar os cards de plataforma (mantendo o conteudo atual: nome, squad, responsavel, contrato, atributos, borda de reputacao)
4. Manter o card "Ver Todos" como botao no topo, fora do Kanban
5. Layout com `flex gap-4 overflow-x-auto` para scroll horizontal quando necessario

```text
┌──────────────────────────────────────────────────────────────────┐
│ [← Voltar]   Cliente X   "Selecione uma plataforma"            │
│                                                                  │
│ [Ver Todos - X projetos, Y demandas]                            │
│                                                                  │
│ ┌─Onboarding──┐ ┌─Implementação─┐ ┌─Escala────────┐ ┌─Perf──┐ │
│ │ Shopee      │ │ ML            │ │               │ │ Shein │ │
│ │ Squad A     │ │ Squad B       │ │               │ │ ...   │ │
│ │ Resp: João  │ │ Resp: Maria   │ │               │ │       │ │
│ └─────────────┘ └───────────────┘ └───────────────┘ └───────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Detalhes Tecnicos
- Reutiliza `clientStatuses` (ja carregado) para definir colunas e labels
- Fases sem plataformas associadas aparecem como colunas vazias (para dar visibilidade do pipeline)
- Clicar no card continua navegando para `setSelectedPlatform(slug)`
- Nenhuma mudanca de banco de dados

