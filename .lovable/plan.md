

## Plano: Reorganizar layout do ClientCard

### Estrutura atual
O card tem muitas seções empilhadas verticalmente: header, squad badge, plataformas, fluxos, lista de demandas pendentes (timeline), badges de responsável/data, e uma grade 3x2 de métricas. Fica denso e difícil de ler.

### Novo layout proposto

**Remover:** lista de demandas pendentes (linhas 352-363) e badges de fluxos (linhas 340-348).

**Reorganizar em 3 zonas claras:**

```text
┌──────────────────────────────────────┐
│ [icon] Nome do Cliente    [status]   │  <- Header (mantém)
│         Segmento                     │
│                                      │
│ 👥 Squad  ·  🛒 Plataforma(s)  ·  ● │  <- Linha de contexto (squad +
│                                 saúde│     plataformas + saúde inline)
│                                      │
│ 👤 Responsável  ·  📅 01/03/2026    │  <- Linha de metadados
│                                      │
├──────────────────────────────────────┤
│  Pendentes  Mensalidade  Setup       │  <- Grade 2x3 de métricas
│     3        R$5.0k      R$2.0k      │     (compacta, separada por
│  Contrato     NPS                    │      border-t)
│    12m        8.5                    │
└──────────────────────────────────────┘
```

### Mudanças no `ClientCard` (único arquivo: `ClientsPage.tsx`)

1. **Remover** o bloco de demandas pendentes (linhas 352-363) e o bloco de fluxos (linhas 340-348)
2. **Fundir** squad + plataformas + saúde numa única linha horizontal de badges compactos
3. **Mover** responsável e data de entrada para uma segunda linha de badges logo abaixo
4. **Simplificar** a grade de métricas para 5 itens: Pendentes, Mensalidade, Setup, Contrato, NPS (remover Saúde da grade, pois já está na linha de contexto como bolinha colorida)
5. Ajustar grid para `grid-cols-5` na linha de métricas para distribuir melhor, ou manter `grid-cols-3` com 2 linhas (5 itens + 1 vazio) -- usarei `grid-cols-5` para uma linha única mais limpa

