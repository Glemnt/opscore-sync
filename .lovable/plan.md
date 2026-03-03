

## Plano: Nível de Qualidade e Saúde da Plataforma nos Cards

### Problema
Os cards de plataforma na aba de Squads (Step 2.5) não mostram o nível de qualidade do cliente naquela plataforma nem um indicador de saúde.

### Solução

**1. Banco de dados — Adicionar campos ao `client_platforms`**

Migração SQL:
```sql
ALTER TABLE client_platforms ADD COLUMN quality_level text DEFAULT NULL;
ALTER TABLE client_platforms ADD COLUMN health_color text DEFAULT NULL;
```

Valores possíveis:
- `quality_level`: `iniciante`, `estruturado`, `competitivo`, `escalando`, `dominante`
- `health_color`: `green`, `orange`, `red`

**2. Hook `useClientPlatformsQuery.ts`**
- Adicionar `qualityLevel` e `healthColor` à interface `ClientPlatform`
- Mapear `quality_level` → `qualityLevel` e `health_color` → `healthColor` no `mapRow`
- Incluir no key map do update mutation

**3. Card da plataforma em `src/pages/ProjectsPage.tsx` (linhas ~691-735)**

Adicionar ao card, entre o header e os dados de Squad/Responsável:

- **Nível de Qualidade** — badge com emoji:
  - 🥉 Iniciante, 🥈 Estruturado, 🥇 Competitivo, 🚀 Escalando, 👑 Dominante

- **Saúde da Plataforma** — indicador colorido (bolinha):
  - 🟢 Excelente, 🟠 Mediano, 🔴 Ruim

Layout: uma linha com o badge de qualidade à esquerda e o indicador de saúde à direita, logo abaixo do nome da plataforma.

**4. Kanban columns (linhas ~634-636)**

Garantir que as colunas do Kanban de fases incluam sempre: Onboarding, Implementação, Performance, Escala (já existem como fallback, mas vou manter consistente).

**5. Edição dos campos**

Adicionar controles de edição (select para quality_level e health_color) no modal/painel onde as plataformas do cliente são editadas — provavelmente no `ClientDetailModal.tsx`, na seção de plataformas operacionais.

Nenhuma mudança estrutural grande — apenas 2 colunas novas e renderização nos cards existentes.

