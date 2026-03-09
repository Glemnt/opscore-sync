

## Plano: Filtrar "Clientes por Etapa" no Dashboard

### Alteracao

**`src/pages/DashboardPage.tsx` — linha 265**

Filtrar `clientStatuses` para exibir apenas os 5 status solicitados antes do `.map()`:

```tsx
// De:
{clientStatuses.map(status => {

// Para:
{clientStatuses
  .filter(s => ['onboarding', 'implementacao', 'performance', 'escala', 'inativo'].includes(s.key))
  .map(status => {
```

Isso garante que apenas Onboarding, Implementacao, Performance, Escala e Inativos aparecem na secao "Clientes por Etapa", sem alterar nenhum calculo ou dado.

