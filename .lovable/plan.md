

## Plano: Replicar estrutura visual do ClientCard na pagina Squads

### Problema
Os cards de clientes na pagina Squads (ProjectsPage) usam um layout diferente e mais simples que os cards da pagina Clientes (ClientsPage). O usuario quer unificar a estrutura visual.

### Mudancas

**`src/pages/ProjectsPage.tsx`** — Substituir o bloco do card do cliente (linhas 492-558) pela mesma estrutura do `ClientCard` da `ClientsPage`:

1. **Header**: Icone Building2 + Nome + Segmento + StatusBadge (usando `statusMap` do cliente)
2. **Linha de contexto**: Squad + Plataformas (badges simples) + Indicador de saude (circulo colorido)
3. **Linha de metadata**: Responsavel + Data de entrada + Telefone + Email + CNPJ
4. **Grid de metricas** (5 colunas): Pendentes, Mensalidade, Setup, Contrato, NPS

Isso remove os mini-cards detalhados de plataforma (com fase, qualidade, atributos) que existem atualmente no card do Squads, substituindo pela versao compacta da pagina Clientes.

Sera necessario garantir que os dados de `statusMap`, `tasks`, `platforms`, `allClientPlatforms`, `squads` e `mockAnalysisData` estejam disponiveis no escopo do card — alguns ja estao, outros precisarao ser passados ou buscados.

