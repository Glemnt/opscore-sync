

## Plano: Melhorar visualização de Full/Turbo/Flex, Saúde, Squad e Plataforma nos cards

### Situação atual
O card já possui Squad, Plataforma (no header), Saúde (bolinha pequena) e badges de atributos (Full/Flex/Turbo). Porém alguns são pouco visíveis ou só aparecem quando preenchidos.

### Alterações em `src/pages/ProjectsPage.tsx` (linhas 688-769)

1. **Plataforma** — Adicionar badge destacado com o nome da plataforma ao lado do nome do cliente no header (ex: badge colorido "Mercado Livre")

2. **Squad** — Já visível, manter como está

3. **Saúde da Plataforma** — Trocar a bolinha pequena (2.5x2.5) por um badge com texto legível (🟢 Excelente / 🟠 Mediano / 🔴 Ruim). Mostrar "—" quando não definida

4. **Full / Turbo / Flex** — Exibir sempre os 3 toggles como badges fixos com estado visual (verde/ativo vs cinza/inativo), em vez de só aparecerem quando ativos. Aplicável apenas quando `platformSlug === 'mercado_livre'`

### Layout resultante do card
```text
┌─────────────────────────────────────┐
│ [icon] Cliente - Plataforma  [Seller]│
│         badge "Mercado Livre"        │
│ 👥 Squad Name    👤 Responsável      │
│ 🟢 Excelente                         │
│ [Full ✓] [Flex ✗] [Turbo ✗]         │
│ fase              [✏️] [↔️] [🗑️]     │
└─────────────────────────────────────┘
```

Sem alterações no banco de dados.

