

## Plano: Suporte a horas e minutos no tempo estimado/real

### Problema
O campo de tempo estimado aceita apenas horas (step 0.5). Tarefas curtas precisam de granularidade em minutos.

### Abordagem
Substituir o input numérico simples por dois campos lado a lado (horas + minutos) nos 3 locais relevantes. O valor armazenado continua em horas decimais (ex: 1h30min = 1.5) para compatibilidade total — apenas a UI muda.

### Alterações

**1. Helper de conversão** — `src/lib/utils.ts`
- `hoursToHM(decimal)` → `{ h: number, m: number }` (ex: 1.75 → {h:1, m:45})
- `hmToHours(h, m)` → decimal (ex: 1, 30 → 1.5)
- `formatTime(decimal)` → string legível (ex: 1.5 → "1h30min", 0.25 → "15min")

**2. `AddTaskDialog.tsx`** (linhas 303-307)
- Substituir input único por dois inputs: Horas (inteiro) + Minutos (0-59, step 5)
- Label: "Tempo estimado"

**3. `TaskDetailModal.tsx`** (linhas 264-285)
- Mesma mudança para os campos Estimado e Real: dois inputs cada (h + min)

**4. `TasksPage.tsx`** (linha 504)
- Usar `formatTime()` no display: `1h30min` em vez de `1.5h`

**5. `ReportsPage.tsx`** (linha 271)
- Usar `formatTime()` no display de média

Nenhuma mudança no banco — o campo continua armazenando horas decimais.

