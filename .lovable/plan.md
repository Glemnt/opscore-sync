

## Plano: Equiparar campos de edição do card de plataforma (Squads) com o card de cliente (Clientes)

### Situação atual

**Edição do cliente (ClientDetailModal)** tem 18 campos:
Nome, Empresa, Segmento, Responsável, Status, Mensalidade, Setup Pago, CNPJ, Telefone, Email, Tipo de Contrato, Dia de Pagamento, Duração do Contrato, Squad, Data de Entrada, Saúde, Plataformas, Observações.

**Edição da plataforma (EditPlatformDialog)** tem apenas 6 campos:
Tipo de Cliente, Data de Onboarding, Origem, Responsável, Vendedor Responsável, Saúde.

### Abordagem

O `EditPlatformDialog` será expandido para editar **tanto dados da plataforma quanto dados do cliente associado**. Ao abrir o dialog, ele buscará o cliente vinculado e permitirá editar os mesmos campos que existem na página de Clientes.

### Alterações

**1. `EditPlatformDialog.tsx`** — Reescrever o componente para:
- Receber o `clientId` da plataforma e buscar os dados do cliente via `useClientsQuery`
- Adicionar todos os campos do cliente que faltam: Nome, Empresa, Segmento, Status, Mensalidade, Setup Pago, CNPJ, Telefone, Email, Tipo de Contrato, Dia de Pagamento, Duração do Contrato, Squad, Observações
- Organizar em duas seções visuais: "Dados do Cliente" e "Dados da Plataforma"
- No submit, chamar tanto `useUpdateClientPlatform` (para campos da plataforma) quanto `useUpdateClient` do contexto (para campos do cliente)
- Adicionar imports necessários: `useClients`, `useSquads`, `useClientStatusesQuery`, `usePlatformsQuery`

**2. `useClientPlatformsQuery.ts`** — Adicionar `deadline` e `notes` ao `keyMap` do `useUpdateClientPlatform` para garantir que campos como notas e prazo da plataforma sejam salvos corretamente.

Nenhuma alteração no banco de dados — todos os campos já existem nas tabelas `clients` e `client_platforms`.

