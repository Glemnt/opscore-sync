

## Plano: Botao "Nova Plataforma" no Squads — cria apenas client_platform

### Entendimento
O botao na pagina Squads deve criar apenas um registro de plataforma (`client_platforms`), sem criar um novo cliente. Como `client_platforms` requer um `client_id`, o formulario tera um dropdown para selecionar um cliente ja existente.

### Campos do novo formulario

| Campo | Origem | Salva em |
|-------|--------|----------|
| Cliente | Dropdown de clientes existentes | `client_platforms.client_id` |
| Plataforma | Selecao de plataformas cadastradas | `client_platforms.platform_slug` |
| Tipo de Cliente (Seller/Lojista) | Botoes | `client_platforms.quality_level` |
| Responsavel pelo Onboarding | Dropdown de usuarios | `client_platforms.responsible` |
| Time Responsavel | Pre-selecionado (disabled) | `client_platforms.squad_id` |
| Saude da Plataforma | Botoes verde/amarelo/vermelho | `client_platforms.health_color` |

Campos como Nome, Empresa, CNPJ, Nicho, Telefone, Email, Faturamento e Tempo de Contrato sao dados do **cliente** e nao se aplicam ao criar apenas uma plataforma — eles ja existem no cadastro do cliente selecionado.

### Alteracoes

**1. `src/components/AddClientSquadDialog.tsx` — reescrever completamente**
- Renomear para `AddPlatformSquadDialog`
- Substituir todos os campos de cliente por um dropdown de selecao de cliente existente
- Manter campos de plataforma: plataforma, tipo de cliente, responsavel, saude
- Ao submeter: cria apenas `client_platform` via `useAddClientPlatform`
- Titulo: "Nova Plataforma — {squadName}"
- Botao: "Adicionar Plataforma"

**2. `src/pages/ProjectsPage.tsx`**
- Renomear botao de "Novo Cliente" para "Nova Plataforma"
- Importar `AddPlatformSquadDialog` no lugar de `AddClientSquadDialog`
- Renomear estado `showAddClientSquad` para `showAddPlatformSquad`

