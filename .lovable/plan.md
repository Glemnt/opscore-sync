

## Plano: Corrigir seleção de responsável e prazo no dialog de geração de demandas

### Problema
O `Select` de responsável e o `Input` de prazo (date) dentro do `GenerateDemandsDialog` podem não estar funcionando corretamente porque:
1. O `SelectContent` (portal Radix) compete em z-index com o `DialogContent` (ambos `z-50`), fazendo o dropdown abrir atrás do dialog
2. O input de data nativo pode ter problemas de interação dentro do dialog

### Mudanças

**1. `src/components/GenerateDemandsDialog.tsx`**
- Adicionar `className="z-[60]"` ao `SelectContent` do responsável para garantir que o dropdown apareça acima do dialog
- Substituir o `Input type="date"` por um **DatePicker com Popover + Calendar** (padrão Shadcn), adicionando `pointer-events-auto` ao Calendar e `z-[60]` ao `PopoverContent` para funcionar dentro do dialog
- Importar `Popover`, `PopoverTrigger`, `PopoverContent`, `Calendar`, `format` e `CalendarIcon`

### Resultado
O dropdown de responsável abrirá corretamente sobre o dialog, e o seletor de data será um calendário visual interativo em vez do date picker nativo do browser.

