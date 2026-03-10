

## Plano: Remover campo "Data de Onboarding" do EditPlatformDialog

Remover o campo `startDate` (Data de Onboarding) do `src/components/EditPlatformDialog.tsx`:

1. Remover o state `startDate` / `setStartDate` (linhas 55-57)
2. Remover `setStartDate(...)` do `useEffect` (linha 80)
3. Remover `startDate` do `handleSubmit` → `updates` (linha 109)
4. Remover o bloco UI do campo (linhas 296-315)
5. Remover imports não utilizados: `CalendarIcon`, `Popover`, `PopoverContent`, `PopoverTrigger`, `Calendar`, `format`, `ptBR` (verificar se ainda são usados em outro lugar do componente antes de remover)

