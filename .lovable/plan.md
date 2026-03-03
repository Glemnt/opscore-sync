

## Plano: Exibir Todos os Campos Operacionais nos Cards de Plataforma (Squads)

### Problema Atual

Os cards de plataforma na página de Squads (Step 2.5) já possuem lógica para mostrar Fase, Responsável, Squad e atributos operacionais, mas:

1. **Fase** — aparece como badge pequeno ao lado do nome, pouco visível
2. **Squad Operacional** — só aparece quando é diferente do squad do cliente
3. **Responsável** — aparece apenas quando preenchido, sem label
4. **Prazo** — não é exibido
5. **Atributos operacionais** — aparecem como badges genéricos, sem labels explícitos

O usuário quer que todos os campos apareçam sempre, de forma clara e estruturada, com labels visíveis.

### Alterações

**Arquivo: `src/pages/ProjectsPage.tsx` (linhas 589-629)**

Reestruturar o card de plataforma para mostrar uma lista organizada de informações:

```text
┌─────────────────────────────────┐
│ 🛒 Mercado Livre                │
│                                 │
│ Fase: Onboarding               │
│ Squad: Time Pantera             │
│ Responsável: Felipe Alves       │
│ Prazo: 15/04/2026               │
│                                 │
│ 🟢  Gold  Full                  │
│                                 │
│ 0 projetos • 0 demandas        │
└─────────────────────────────────┘
```

Campos específicos por plataforma (usando `PLATFORM_ATTRIBUTE_DEFINITIONS`):
- **Mercado Livre**: Reputação, Medalha, Envios
- **Shopee**: Vendedor Indicado, Shopee Express, Shopee Entrega Direta, Full Shopee
- **Shein**: Reputação

Cada atributo será renderizado com seu label explícito (ex: "Reputação: 🟢 Verde") em vez de apenas o badge.

### Detalhes Técnicos

- Importar `PLATFORM_ATTRIBUTE_DEFINITIONS` do `PlatformAttributesEditor` para renderizar os atributos com labels
- Mostrar **Squad sempre** (não apenas quando diferente do squad do cliente) — pegar do `cp.squadId` ou fallback para o squad do cliente
- Mostrar **Prazo** usando `cp.deadline` com formatação `dd/MM/yyyy`
- Mostrar **Fase** como linha separada com label, não como badge inline no título
- Para atributos não preenchidos, mostrar "—" como valor padrão
- Manter a seção de projetos/demandas no rodapé do card

