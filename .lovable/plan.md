

## Plano: Melhorar dialog de adicionar/remover plataformas na pagina Squads

### Situacao atual
- O dialog de "Adicionar Plataforma" usa um `<Select>` mostrando apenas as plataformas ainda nao adicionadas
- O botao "Adicionar Plataforma" fica oculto quando nao ha plataformas disponiveis
- Nao existe opcao de remover uma plataforma ja adicionada ao cliente

### Mudancas em `src/pages/ProjectsPage.tsx`

**1. Importar `useDeleteClientPlatform`** do hook existente em `useClientPlatformsQuery.ts`

**2. Substituir o dialog atual por uma lista completa de plataformas:**
- Mostrar TODAS as plataformas cadastradas em Configuracoes (`platformOptions`)
- Cada plataforma aparece como um item com:
  - Nome da plataforma
  - Botao "Adicionar" (habilitado) se ainda nao foi adicionada ao cliente
  - Botao "Remover" (vermelho) se ja foi adicionada — com confirmacao
  - Visual desabilitado/cinza + badge "Adicionada" para as que ja estao vinculadas

**3. Mostrar o botao "Adicionar Plataforma" sempre** (remover condicional `available.length > 0`)
- O dialog agora serve tanto para adicionar quanto para remover

**4. Logica de remocao:**
- Chamar `deleteClientPlatformMut.mutate(platformId)` para remover o registro em `client_platforms`
- Atualizar o array `clients.platforms` removendo o slug via `updateClientField`
- Atualizar `selectedClient` local

**5. Layout do dialog:**
```text
┌─ Gerenciar Plataformas ──────────────────┐
│                                          │
│  Mercado Livre    [✓ Adicionada]  [🗑]   │
│  Shopee           [✓ Adicionada]  [🗑]   │
│  Amazon           [ + Adicionar ]        │
│  Magalu           [ + Adicionar ]        │
│                                          │
│                          [Fechar]        │
└──────────────────────────────────────────┘
```

Nenhuma migracao de banco necessaria — `useDeleteClientPlatform` ja existe no hook.

