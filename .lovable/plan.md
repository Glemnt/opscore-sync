

## Plano: Formulario dedicado de criacao de cliente para a pagina Squads

### Contexto
O formulario atual (`AddClientDialog`) compartilha campos com a pagina de Clientes. O usuario quer um formulario completamente diferente para a pagina Squads, com campos especificos e novos campos que nao existem no formulario original.

### Campos solicitados vs situacao atual

| Campo | Status |
|-------|--------|
| Nome do Cliente | Ja existe |
| Nome da Empresa | Ja existe |
| CNPJ | Ja existe |
| Nicho do Cliente | Ja existe (campo "Segmento") |
| Tipo de Cliente (Seller/Lojista) | **NOVO** — salvar como `quality_level` no `client_platforms` |
| Telefone | Ja existe |
| Email | Ja existe |
| Plataforma | Ja existe |
| Origem (trafego, indicacao, etc) | **NOVO** — precisa de coluna no banco |
| Responsavel pelo Onboarding | Ja existe (campo "Responsavel") |
| Time Responsavel | Ja existe (campo "Squad", pre-selecionado) |
| Tempo de Contrato | Ja existe (6/12 meses) |
| Saude da Plataforma | **NOVO** — salvar como `health_color` no `client_platforms` |
| Faturamento do Cliente | **NOVO** — substituir mensalidade por faixas (ate 30k / 30-100k / 100k+) |

Campos que serao REMOVIDOS neste formulario: Setup Pago, Tipo de Contrato, Dia de Pagamento, Fluxo de Demandas (tab inteira).

### Alteracoes

**1. Migracao de banco — adicionar coluna `origin` na tabela `clients`**
```sql
ALTER TABLE public.clients ADD COLUMN origin text NOT NULL DEFAULT '';
```

**2. Novo componente `src/components/AddClientSquadDialog.tsx`**
Formulario dedicado com layout otimizado contendo apenas os campos solicitados:
- Nome do Cliente, Nome da Empresa, CNPJ (inputs de texto)
- Nicho do Cliente (input texto, mapeado para `segment`)
- Tipo de Cliente — select com opcoes "Seller" e "Lojista"
- Telefone, Email (inputs)
- Plataforma — selecao de plataformas (igual ao existente)
- Origem — select com opcoes: Trafego, Indicacao, Organico, Outro
- Responsavel pelo Onboarding — select de appUsers
- Time Responsavel — select de squads (pre-selecionado e desabilitado)
- Tempo de Contrato — select 6/12 meses
- Saude da Plataforma — botoes com indicadores verde/amarelo/vermelho
- Faturamento do Cliente — select com faixas: "Ate 30k", "30k - 100k", "100k+"

Ao submeter:
- Cria o cliente via `addClient` com os dados mapeados (faturamento converte faixa em valor representativo para `monthlyRevenue`)
- Cria registro em `client_platforms` com `quality_level` (tipo de cliente) e `health_color` (saude) para cada plataforma selecionada

**3. `src/pages/ProjectsPage.tsx`**
- Substituir `AddClientDialog` por `AddClientSquadDialog` na view de squad selecionado
- Passar `defaultSquadId={selectedSquad.id}`

**4. Atualizar `src/types/index.ts`**
- Adicionar campo `origin?: string` na interface `Client`

