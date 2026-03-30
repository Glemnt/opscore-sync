

## Fix: Normalizar cargos e nomes na página Admin

### Problema
1. `roleLabels` (linhas 32-38) usa ALL CAPS: `'AUXILIAR DE ECOMMERCE'`, `'MANAGER'`, etc.
2. `allRoleLabels` (linhas 42-48) mistura title case (legado) com ALL CAPS (oficial).
3. Linha 552: `u.name` renderizado sem formatação — nomes em minúscula no banco aparecem assim.

### Correção em `src/pages/SettingsPage.tsx`

**1. Atualizar `roleLabels` e `allRoleLabels` (linhas 31-48)**

```typescript
const roleLabels: Record<string, string> = {
  auxiliar_ecommerce: 'Auxiliar de E-commerce',
  assistente_ecommerce: 'Assistente de E-commerce',
  manager: 'Manager',
  head: 'Head',
  cs: 'CS',
  coo: 'COO',
  ceo: 'CEO',
};

const allRoleLabels: Record<string, string> = {
  ...roleLabels,
  operacional: 'Operacional',
  design: 'Design',
  copy: 'Copy',
  gestao: 'Gestão',
};
```

**2. Criar helper `titleCase` e aplicar em `u.name` (linha 552)**

```typescript
function titleCase(str: string)