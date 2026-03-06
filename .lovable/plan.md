

## Plano: Reestruturar abas do Kanban de Clientes

### Situacao atual

As abas do Kanban na pagina Clientes vem da tabela `client_statuses` (filtradas por `board = 'clients'`). Atualmente existem: Onboarding (Em Espera), Reuniao Agendada, Reuniao Concluida, Inativo (Churn) — que nao correspondem ao que voce precisa.

### Solucao

**1. Migracao SQL** — Substituir os registros de `client_statuses` com `board = 'clients'` pelos novos:

| Aba | Key | Cor |
|-----|-----|-----|
| Ativo | `active` | Verde |
| Inativo | `inactive` | Cinza |
| Onboarding | `onboarding` | Laranja |
| Implementacao | `implementacao` | Azul |
| Performance | `performance` | Roxo |
| Escala | `escala` | Verde |

A aba "Todos" ja existe no codigo (valor `'all'` hardcoded).

**2. Atualizar status dos clientes existentes** — Clientes com status antigos (ex: `inativo_churn`) serao mapeados para os novos keys para nao ficarem orfaos.

**3. Nenhuma alteracao de codigo** — O componente `ClientsPage.tsx` ja le dinamicamente da tabela `client_statuses` e gera as abas. A query atual nao filtra por `board`, entao os novos registros aparecerao automaticamente.

### Nota
Os registros com `board = 'squads'` nao serao afetados.

