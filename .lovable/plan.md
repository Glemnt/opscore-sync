

## Plano: Indicadores Visuais de Reputação nos Cards de Plataforma

### Objetivo
Adicionar uma borda lateral colorida (verde/amarelo/laranja/vermelho) no card de cada plataforma baseada no campo `reputacao` dos `platformAttributes`, permitindo identificação visual rápida de problemas.

### Lógica de Cores

**Mercado Livre** (campo `reputacao`):
- `verde` → borda verde (saúde boa)
- `amarelo` → borda amarela (atenção)
- `laranja` → borda laranja (alerta)
- `vermelho` → borda vermelha (problema)
- sem valor → borda padrão (cinza)

**Shein** (campo `reputacao`):
- `L4`, `L5` → verde
- `L3` → amarelo
- `L2` → laranja
- `L1` → vermelho

**Shopee** — sem campo de reputação, mantém borda padrão.

### Alterações

**Arquivo: `src/pages/ProjectsPage.tsx`**

1. Criar uma função helper `getReputationColor(slug, attrs)` que retorna uma classe Tailwind de `border-l-4` com a cor correspondente
2. Aplicar essa classe no `<div>` do card de plataforma (linha ~609), adicionando a borda lateral colorida
3. Opcionalmente adicionar um pequeno dot colorido ao lado do nome da plataforma para reforço visual

### Detalhes
- A borda lateral (`border-l-4`) é um padrão comum para indicadores de status em cards
- Cores usadas: `border-l-green-500`, `border-l-yellow-500`, `border-l-orange-500`, `border-l-red-500`
- Sem valor de reputação: sem borda lateral extra (mantém visual atual)
- Nenhuma mudança de banco de dados

