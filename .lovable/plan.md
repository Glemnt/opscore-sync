

## Plano: Melhorar legibilidade dos cards na pagina Squads

### Problema
As colunas Kanban na pagina Squads tem `w-72` (288px), o que comprime demais o conteudo dos cards. Na pagina Clientes, os cards estao em `grid grid-cols-3` com muito mais espaco, tornando as informacoes legiveis.

### Mudancas em `src/pages/ProjectsPage.tsx`

1. **Aumentar largura das colunas Kanban** de `w-72` para `w-80` (320px) — mais espaco para os badges e metricas.

2. **Simplificar o card para o contexto Kanban** — o card na pagina Squads nao precisa mostrar Squad (ja esta agrupado por squad) nem todos os dados de contato. Ajustar para mostrar apenas:
   - **Header**: Nome + Segmento + StatusBadge
   - **Linha de contexto**: Plataformas + Saude (circulo colorido)
   - **Linha de metadata**: Responsavel + Data de entrada
   - **Grid de metricas**: Reduzir para 3 colunas (Pendentes, Mensalidade, Contrato) em vez de 5, para nao ficar apertado

3. **Aumentar tamanho dos textos nos badges** de `text-[10px]` para `text-xs` (12px) para melhor legibilidade.

4. **Remover dados de contato do card** (Phone, Email, CNPJ) — esses detalhes ficam no modal de detalhe, nao precisam estar no card do Kanban.

Essas mudancas tornam o card mais limpo e legivel no contexto das colunas Kanban, sem perder as informacoes essenciais.

