

## Plano: Padronizar colunas dos Kanbans

### Estado atual

| Board | Colunas atuais |
|-------|---------------|
| clients | Ativo, Onboarding, Inativo |
| squads | Onboarding (Em Espera), Ativo, Inativo |
| all (orphan) | teste, Reunião Agendada |

### Objetivo

Ambos os boards (clients e squads) devem ter exatamente 4 colunas na ordem:

**Onboarding → Reunião Agendada → Ativo → Inativo**

### Alteracoes

**Migração SQL** (uma unica operacao):

1. Remover registros orfaos (board='all'): "teste" e "Reunião Agendada"
2. Atualizar sort_order e labels dos registros existentes em ambos os boards
3. Inserir "Reunião Agendada" nos boards clients e squads (com sort_order=1)
4. Corrigir label do onboarding no board squads (remover "Em Espera")

Resultado final na tabela `client_statuses`:

```text
board    | key               | label              | sort_order
---------|-------------------|--------------------|----------
clients  | onboarding        | Onboarding         | 0
clients  | reuniao_agendada  | Reunião Agendada   | 1
clients  | active            | Ativo              | 2
clients  | inativo           | Inativo            | 3
squads   | onboarding        | Onboarding         | 0
squads   | reuniao_agendada  | Reunião Agendada   | 1
squads   | active            | Ativo              | 2
squads   | inativo           | Inativo            | 3
```

Nenhuma alteracao de codigo necessaria — o hook `useClientStatusesQuery` ja filtra por board e renderiza as colunas dinamicamente.

