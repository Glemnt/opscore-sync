

## Plano: Exibir Atributos Operacionais nos Cards de Plataforma (Squads)

### Contexto

Os atributos operacionais (Reputação, Medalha, Envios no ML; Vendedor Indicado, Express, etc. na Shopee; Reputação L1-L5 na Shein) já são salvos no `platform_attributes` JSONB e exibidos na página de Clientes. Porém, na página de Squads eles não aparecem em dois lugares:

1. **Card do cliente no Kanban** (Step 2) — mostra badges de plataforma sem atributos
2. **Card da plataforma na seleção** (Step 2.5) — mostra fase, responsável e squad, mas não os atributos operacionais

### Alterações

**Arquivo: `src/pages/ProjectsPage.tsx`**

1. **Importar** `getPlatformAttributeSummary` de `PlatformAttributesEditor`

2. **Card do cliente no Kanban (linhas ~452-461)**: Adicionar resumo de atributos ao lado do nome da plataforma, usando `getPlatformAttributeSummary` com dados de `clientPlatformsData` — idêntico ao que já é feito no `ClientCard` da página de Clientes

3. **Card da plataforma na seleção (linhas ~583-614)**: Adicionar uma seção de badges compactos abaixo do responsável/squad, mostrando os atributos configurados (ex: "🟢 Gold · Full" para ML, "Indicado · Express" para Shopee, "L3" para Shein)

### Detalhes

- Reutilizar a função `getPlatformAttributeSummary` já existente, sem duplicar lógica
- Os badges terão o mesmo estilo compacto usado na `ClientsPage` (`text-[10px]` com fundo `muted`)
- Nenhuma mudança de banco de dados necessária — os dados já existem na coluna `platform_attributes`

