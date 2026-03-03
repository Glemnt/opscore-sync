

## Plano: Adicionar informações visuais ao card do cliente

### Dados já disponíveis no modelo `Client`
- `contractDurationMonths` → Prazo de contrato (6 ou 12 meses)
- `responsible` → Responsável pelo cliente
- `startDate` → Data de entrada do cliente

### Dado novo necessário
- **Setup Pago** (`setupFee`) → Não existe no banco nem no tipo. Precisa ser adicionado.

### Alterações

**1. Banco de dados — Adicionar coluna `setup_fee`**
- Migração: `ALTER TABLE clients ADD COLUMN setup_fee numeric DEFAULT NULL;`

**2. Tipo `Client` em `src/types/index.ts`**
- Adicionar `setupFee?: number;`

**3. Mapeamento DB → Client em `src/types/database.ts`**
- Mapear `setup_fee` → `setupFee`

**4. Hook `useClientsQuery.ts`**
- Incluir `setup_fee` / `setupFee` no insert e no update key map

**5. Card do cliente em `src/pages/ClientsPage.tsx`**

Reorganizar a seção de métricas no rodapé do card para incluir as novas informações. O grid passará de 2x2 para mostrar:

- **Responsável** — badge com ícone `User` e nome do responsável (acima da seção de métricas)
- **Data de Entrada** — formato `dd/mm/aaaa` com ícone `Calendar`
- **Prazo de Contrato** — exibir "6 meses" ou "12 meses" (ou "—" se não definido)
- **Mensalidade** — já existente
- **Setup Pago** — valor do setup no mesmo formato da mensalidade (`R$X.Xk` ou `—`)
- Manter: Pendentes, NPS, Saúde

Layout do rodapé: grid 3 colunas com as 6 métricas (Pendentes, Mensalidade, Setup, Contrato, NPS, Saúde). Responsável e Data de Entrada ficam como badges inline acima do rodapé.

**6. Modal `AddClientDialog` e `ClientDetailModal`**
- Adicionar campo de input para Setup Pago (mesmo padrão do campo Mensalidade)

