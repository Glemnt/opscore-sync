

## Plano: Fluxo Automático de Demandas por Fase + Transferência de Plataforma

### Contexto
Na página Squads, dentro do card de plataforma de um cliente, o usuário quer:
1. Gerar automaticamente demandas padrão baseadas na fase da plataforma (Onboarding, Implementação, Performance, Escala), escolhendo se são demandas do cliente ou internas, e preenchendo apenas responsável e prazo
2. Transferir a plataforma para outro squad/responsável

---

### 1. Banco de dados -- Nova tabela `phase_demand_templates`

```sql
CREATE TABLE phase_demand_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase text NOT NULL,              -- onboarding, implementacao, performance, escala
  title text NOT NULL,              -- nome da demanda
  demand_owner text NOT NULL DEFAULT 'internal', -- 'client' ou 'internal'
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE phase_demand_templates ENABLE ROW LEVEL SECURITY;
-- RLS: authenticated users can CRUD
```

Essa tabela armazena os templates de demandas que o admin configura para cada fase.

### 2. Hook `usePhaseDemandsQuery.ts`

Novo hook com:
- `usePhaseDemandsQuery()` -- lista todos os templates
- `useAddPhaseDemand()` -- adiciona template
- `useDeletePhaseDemand()` -- remove template
- `useUpdatePhaseDemand()` -- edita template

### 3. Componente `PhaseDemandConfigDialog.tsx`

Dialog acessível pelo admin (botão no card da plataforma ou nas configurações) para:
- Selecionar a fase (Onboarding, Implementação, Performance, Escala)
- Listar demandas padrão dessa fase
- Adicionar/remover demandas com tipo (Cliente / Interna)
- Salvar no banco

### 4. Componente `GenerateDemandsDialog.tsx`

Dialog que abre ao clicar "Gerar Demandas" no card da plataforma:
- Carrega os templates da fase atual da plataforma
- Exibe lista de demandas a serem criadas com checkboxes
- Cada demanda tem campos editáveis: **Responsável** (select com membros do squad) e **Prazo** (date picker)
- Botão "Criar Todas" que gera as tasks no banco via `addTask`
- As tasks criadas ficam vinculadas ao `clientId`, com a plataforma no campo `platforms`

### 5. Botão "Transferir Plataforma" no card

Adicionar ao card da plataforma (junto aos dados de Squad/Responsável):
- Botão/ícone de transferência
- Abre um dialog simples com:
  - Select de Squad destino
  - Select de Responsável (membros do squad selecionado)
- Salva via `useUpdateClientPlatform` (campos `squadId` e `responsible`)

### 6. Alterações em `ProjectsPage.tsx`

No card da plataforma (linhas ~709-774):
- Adicionar botão "⚡ Gerar Demandas" no footer do card
- Adicionar ícone de transferência (ArrowRightLeft) ao lado do Squad
- Integrar os dois novos dialogs

### Resumo de arquivos

| Arquivo | Ação |
|---|---|
| Migração SQL | Criar tabela `phase_demand_templates` |
| `src/hooks/usePhaseDemandsQuery.ts` | Novo hook CRUD |
| `src/components/PhaseDemandConfigDialog.tsx` | Novo -- config de templates por fase |
| `src/components/GenerateDemandsDialog.tsx` | Novo -- gerar demandas com responsável/prazo |
| `src/pages/ProjectsPage.tsx` | Adicionar botões e integrar dialogs |

Nenhuma mudança nas tabelas existentes.

