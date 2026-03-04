

## Plano: Reorganizar filtros da pagina Clientes

### Layout proposto

```text
Linha 1: [Barra de Busca]  [Responsavel ▼] [Squad ▼] [Saude ▼] [Data ▼] [Plataforma ▼]
Linha 2: [Todos] [Ativo] [Onboarding] [Inativo] [+ custom statuses...] [+]
```

### Mudancas em `src/pages/ClientsPage.tsx`

**1. Adicionar estado para filtro de responsavel e plataforma:**
- `responsibleFilter` (string, default `'all'`)
- `platformFilter` (string, default `'all'`)

**2. Extrair listas unicas para os selects:**
- Responsaveis: `[...new Set(clients.map(c => c.responsible).filter(Boolean))]`
- Plataformas: usar `usePlatformsQuery()` (ja importado)

**3. Atualizar logica de filtragem:**
- Adicionar `matchResponsible` e `matchPlatform` ao filtro existente
- `matchPlatform`: verifica se `client.platforms?.includes(platformFilter)`

**4. Reorganizar o JSX dos filtros em 2 linhas:**
- **Linha 1**: Busca (flex-1 max-w-sm) + selects de Responsavel, Squad, Saude, Plataforma + date range — tudo em `flex items-center gap-3`
- **Linha 2**: Pipeline tabs (Todos + statuses do banco) com botao de adicionar status — em `flex items-center gap-1.5` com fundo `bg-card border`

Nenhuma migracao de banco necessaria.

