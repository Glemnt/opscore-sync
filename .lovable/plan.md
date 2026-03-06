

## Plano: "Nova Plataforma" com formulario completo (sem vincular a cliente existente)

O botao "Nova Plataforma" criara um **cliente novo** (com os dados preenchidos) **e** um registro em `client_platforms`, tudo de uma vez. O card no Kanban exibira o nome no formato **"Nome do Cliente - Nome da Plataforma"**.

### Alteracao unica: `src/components/AddPlatformSquadDialog.tsx`

Reescrever o componente substituindo o dropdown de cliente existente pelo formulario completo com todos os 14 campos:

| Campo | Componente |
|-------|-----------|
| Nome do Cliente | Input texto |
| Nome da Empresa | Input texto |
| CNPJ | Input texto |
| Nicho do Cliente | Input texto |
| Tipo de Cliente | Botoes Seller / Lojista |
| Telefone | Input texto |
| Email | Input texto |
| Plataforma | Botoes (selecao unica) |
| Origem | Select (Trafego, Indicacao, Organico, Outro) |
| Responsavel Onboarding | Select (app_users) |
| Time Responsavel | Select disabled (pre-selecionado) |
| Tempo de Contrato | Select (6 / 12 meses) |
| Saude da Plataforma | Botoes verde/amarelo/vermelho |
| Faturamento | Botoes (Ate 30k / 30-100k / 100k+) |

### Logica de submit

1. Cria o cliente via `addClient()` com `name` = **"NomeCliente - NomePlataforma"** (ex: "Joao Silva - Mercado Livre")
2. No `onSuccess`, cria `client_platform` via `useAddClientPlatform` com `qualityLevel`, `healthColor`, `squadId`
3. Exibe toast de sucesso/erro

### O que NAO muda
- `ProjectsPage.tsx` — ja importa e usa `AddPlatformSquadDialog` corretamente
- Nenhuma migracao de banco necessaria (a coluna `platforms` ja foi alterada para `text[]`)

