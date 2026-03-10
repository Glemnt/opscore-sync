

## Plano: Adicionar detalhes operacionais da plataforma no PlatformDetailModal

### Objetivo
Ao clicar no card de plataforma no Kanban de Squads, o modal de detalhes (`PlatformDetailModal`) passará a exibir uma seção editável com os mesmos campos operacionais que existem na página de Clientes (`ClientDetailModal`, linhas 102-193).

### O que será adicionado
Uma nova seção "Detalhes da Plataforma" no modal, entre o header e a seção de Análise por IA, contendo:

1. **Grid de dropdowns editáveis (2 colunas):**
   - Fase (usando `platform_phase_statuses`)
   - Squad Operacional
   - Responsável
   - Tempo de Contrato (6/12 meses)
   - Nível de Qualidade (Seller/Lojista)
   - Saúde da Plataforma (Excelente/Mediano/Ruim)

2. **Contagem de demandas** (X demandas, Y pendentes)

3. **Atributos Operacionais** via `PlatformAttributesEditor` — renderiza automaticamente os campos corretos por plataforma (Mercado Livre: Reputação, Medalha, Full, Flex, Turbo; Shopee: Indicado, Express, etc.; Shein: Reputação L1-L5)

### Alteração

**`src/components/PlatformDetailModal.tsx`**
1. Importar hooks: `useUpdateClientPlatform`, `usePlatformPhaseStatusesQuery`, `useAppUsersQuery`, `useSquads`, `useTasks`, `PlatformAttributesEditor`
2. Adicionar nova seção editável após o header (antes da Análise por IA), replicando o layout da `ClientDetailModal` (linhas 102-193)
3. Cada dropdown chama `updatePlatform.mutate(...)` no `onChange`, igual ao padrão existente

Nenhuma alteração no banco de dados.

