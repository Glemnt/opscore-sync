

## Plano: Clientes nao aparecem na pagina Squads — status orfaos

### Causa raiz

O Kanban da pagina Squads usa `client_statuses` do banco para gerar as colunas. Atualmente existem **apenas 3 status** cadastrados na tabela `client_statuses`:

| key | label |
|-----|-------|
| active | Ativo |
| onboarding | Onboarding (Em Espera) |
| escala | Inativo (Churn) |

Porem, os clientes no banco possuem **6 status distintos**:

| status | qtd |
|--------|-----|
| active | 42 |
| implementacao | 29 |
| onboarding | 17 |
| inativo | 3 |
| escala | 2 |
| custom_1772420883831 | 2 |

Clientes com status `implementacao`, `inativo` e `custom_1772420883831` **nao tem coluna correspondente no Kanban**, entao ficam invisiveis. Isso afeta 34 clientes (36% do total).

A pagina de Clientes tem o mesmo problema nos filtros de status — so mostra as 3 opcoes cadastradas.

### Solucao

**1. `src/pages/ProjectsPage.tsx` (~5 linhas):**
No `useEffect` que sincroniza colunas (L162-166), apos mapear `clientStatuses`, detectar status usados pelos clientes que nao tem coluna e adicionar colunas extras automaticamente com label = capitalize(key).

```tsx
useEffect(() => {
  if (clientStatuses.length > 0) {
    const baseCols = clientStatuses.map(s => ({ id: s.key, label: s.label, status: s.key }));
    const knownKeys = new Set(baseCols.map(c => c.status));
    const orphanStatuses = [...new Set(clients.map(c => c.status))].filter(s => !knownKeys.has(s));
    const extraCols = orphanStatuses.map(s => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1), status: s }));
    setClientCols([...baseCols, ...extraCols]);
  }
}, [clientStatuses, clients]);
```

**2. `src/pages/ClientsPage.tsx` (~5 linhas):**
Mesma logica nos `statusFilters` — incluir status orfaos para que aparecam nas abas de filtro.

**3. Alternativa (recomendada em paralelo):**
Criar os status faltantes na tabela `client_statuses` via migracao para resolver definitivamente:
- `implementacao` → "Implementacao"
- `inativo` → "Inativo"

O status `custom_1772420883831` parece ser um status customizado criado e depois deletado — precisaria ser tratado ou os clientes migrados para outro status.

### Resumo
- 2 arquivos alterados (~10 linhas total)
- 1 migracao opcional para criar status faltantes
- Sem quebra de funcionalidade existente

