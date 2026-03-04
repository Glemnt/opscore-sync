

## Plano: Converter Envios do Mercado Livre de select para toggles

### Mudança

**`src/components/PlatformAttributesEditor.tsx`**:

1. Substituir o campo `envios` (tipo `select`) por 3 campos independentes do tipo `toggle`:
   - `envios_full` → "Full"
   - `envios_flex` → "Flex"
   - `envios_turbo` → "Turbo"

2. Atualizar `getPlatformAttributeSummary` para ler os 3 campos booleanos em vez do antigo valor string.

```typescript
// Antes (1 select)
{ key: 'envios', label: 'Envios', type: 'select', options: [...] }

// Depois (3 toggles)
{ key: 'envios_full',  label: 'Full',  type: 'toggle' },
{ key: 'envios_flex',  label: 'Flex',  type: 'toggle' },
{ key: 'envios_turbo', label: 'Turbo', type: 'toggle' },
```

Summary helper atualizado:
```typescript
if (attrs.envios_full) parts.push('Full');
if (attrs.envios_flex) parts.push('Flex');
if (attrs.envios_turbo) parts.push('Turbo');
```

Nenhuma migração de banco necessária — os atributos são armazenados em JSONB, então as novas chaves funcionam automaticamente.

