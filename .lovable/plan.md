

## Fix: Mostrar todas as etapas do Kanban em "Clientes por Etapa"

### Causa

Linha 277 de `DashboardPage.tsx` filtra apenas `['onboarding', 'implementacao', 'performance', 'escala', 'inativo']` — keys que não existem mais no board `clients`. As keys atuais são `onboarding`, `reuniao_agendada`, `active`, `inativo`.

### Correção

Remover o `.filter()` da linha 277 para exibir todos os status retornados pela query (que já filtra por `board = 'clients'`). Os status já vêm ordenados por `sort_order`, então a ordem será: Onboarding → Reunião Agendada → Ativo → Inativo.

Alteração em uma única linha no arquivo `src/pages/DashboardPage.tsx`.

