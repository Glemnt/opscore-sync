

## Plano: Corrigir bug visual dos calendários no modal do cliente

### Problema
Na importação do `ClientDetailModal.tsx`, o ícone `Calendar` do lucide-react foi renomeado para `CalendarIcon` (linha 2), e o componente `Calendar` do shadcn (DayPicker completo) foi importado como `Calendar` (linha 5).

Porém, em vários lugares do modal, `<Calendar className="w-3 h-3" />` é usado onde a intenção era exibir apenas um **ícone de calendário**. Isso faz com que o componente DayPicker completo (com dias, meses, navegação) seja renderizado inline, causando o bug visual visível na screenshot.

### Locais afetados

- **Linha 628**: `<Calendar className="w-4 h-4" />` no "Próx. pagamento" → deveria ser `<CalendarIcon>`
- **Linha 773**: `<Calendar className="w-3 h-3" />` no TimelineItem (data de criação) → deveria ser `<CalendarIcon>`

### Correção

Substituir `Calendar` por `CalendarIcon` nessas duas linhas. Nenhuma outra alteração necessária — os usos legítimos do componente Calendar (como no Popover de edição de data, linha 305) continuam corretos.

