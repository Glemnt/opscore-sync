

## Plano: Padronizar colunas dos Kanbans com Onboarding, Reunião Agendada, Ativo e Inativo

### Situacao atual

| Board | Colunas existentes |
|-------|-------------------|
| clients | Ativo, Onboarding, Implementação, Performance, Escala, Inativo |
| squads | Onboarding (Em Espera), Reunião Agendada |

O board **squads** esta faltando as colunas **Ativo** e **Inativo**.

### Solucao

Inserir os 2 registros faltantes na tabela `client_statuses` para o board `squads`:

| key | label | board | sort_order |
|-----|-------|-------|------------|
| active | Ativo | squads | 2 |
| inativo | Inativo | squads | 3 |

Isso garante que o Kanban de Squads tenha as 4 colunas padrao: Onboarding → Reunião Agendada → Ativo → Inativo.

Nenhuma alteracao de codigo necessaria — o Kanban ja le dinamicamente da tabela.

