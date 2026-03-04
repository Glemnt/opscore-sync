

## Plano: Atualizar card do cliente na ProjectsPage

### Situacao atual
O card ja exibe plataformas, fase, saude e qualidade. Faltam a **data de entrada** e a **data de vencimento da fatura**.

### Mudancas

**`src/pages/ProjectsPage.tsx`** — No card do cliente (linhas 492-549):

1. **Adicionar data de entrada** (`client.startDate`) — Badge com icone de calendario mostrando a data formatada em pt-BR, posicionado apos o segmento.

2. **Adicionar data de vencimento da fatura** (`client.paymentDay`) — Badge mostrando "Venc. dia X" (onde X e o `paymentDay` do cliente), ao lado da data de entrada.

3. **Manter** plataforma, fase, saude/qualidade como ja estao.

4. **Remover** a linha de contagem de projetos (opcional, ja que o usuario definiu exatamente o que quer no card).

Layout final do card:
- Nome + Segmento
- Data de entrada + Vencimento da fatura (numa linha)
- Mini-cards de plataforma (com fase, saude, qualidade — como ja esta)

Nenhuma mudanca de banco de dados necessaria — todos os campos ja existem.

