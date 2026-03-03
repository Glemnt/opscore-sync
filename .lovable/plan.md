

## Plano: Datepicker com Calendário para "Data de Entrada"

### Problema
O campo "Entrada" no modal do cliente usa `<Input type="date">`, que depende do datepicker nativo do navegador. O usuário quer um calendário visual igual ao dos filtros de data.

### Alteração

**Arquivo: `src/components/ClientDetailModal.tsx`**

No componente `EditableField` (linhas 256-296), adicionar um caso especial para `field === 'startDate'` que renderiza um **Popover + Calendar** (shadcn) em vez do `<Input type="date">`:

- Quando o campo `startDate` entra em modo de edição, exibir um `Popover` com o componente `Calendar` do shadcn
- Ao selecionar uma data no calendário, salvar automaticamente (chamar `saveEdit` com a data formatada como `YYYY-MM-DD`)
- Importar `Calendar`, `Popover`, `PopoverTrigger`, `PopoverContent` e `format` do date-fns

```text
┌─────────────────────────┐
│ Entrada                 │
│ 15 mar 2025  ✏️         │  ← clica no ícone de edição
│                         │
│ ┌─────────────────────┐ │
│ │    Março 2025       │ │  ← calendário abre inline
│ │ D  S  T  Q  Q  S  S│ │
│ │ ...   [15]  ...     │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

Nenhuma mudança de banco de dados.

