

## Plano: Melhorar visual dos cards de clientes na aba Squads

### Problema
Os cards de clientes no Kanban da aba Squads mostram as plataformas como badges inline com texto corrido que fica confuso e difícil de ler -- fase, atributos e nome se misturam em uma linha só.

### Solução

**Arquivo: `src/pages/ProjectsPage.tsx` (linhas ~478-523)**

Redesenhar o card do cliente para um layout mais organizado e legível:

**Layout proposto do card:**

```text
┌──────────────────────────────┐
│  Nome do Cliente             │
│  Segmento                    │
│                              │
│  ┌─ Mercado Livre ─────────┐ │
│  │ 📦 Implementação        │ │
│  │ 🥇 Competitivo  🟢     │ │
│  │ Ouro · Flex             │ │
│  └─────────────────────────┘ │
│  ┌─ Shopee ────────────────┐ │
│  │ 📦 Performance          │ │
│  │ 🥈 Estruturado  🟠     │ │
│  │ Indicado · Express      │ │
│  └─────────────────────────┘ │
│                              │
│  0 projetos  •  0 ativos     │
└──────────────────────────────┘
```

**Mudanças concretas:**

1. Substituir os badges inline (`flex-wrap gap-1`) por cards individuais por plataforma usando `div` com `space-y-1.5`
2. Cada plataforma vira um mini-card com:
   - **Header**: ícone + nome da plataforma + bolinha de saúde (health_color) alinhada à direita
   - **Linha 1**: Badge da fase (Onboarding, Implementação, etc.) com cor de destaque
   - **Linha 2**: Nível de qualidade com emoji (se definido)
   - **Linha 3**: Atributos específicos (Ouro, Flex, etc.) em texto muted menor
3. Cada mini-card terá fundo `bg-muted/40`, `rounded-lg`, `p-2`, borda sutil
4. Manter o footer com "X projetos • Y ativos"

Nenhuma mudança de banco de dados. Apenas reorganização visual do JSX existente.

