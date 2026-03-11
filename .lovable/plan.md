

## Plano: Adicionar campo de pesquisa no dropdown "Tipo de demanda"

### Problema
O Select atual não possui busca, dificultando encontrar tipos quando há muitos cadastrados.

### Solução
Substituir o `Select` por um Combobox usando `Popover` + `Command` (cmdk), com campo de busca integrado.

### Alteração em `src/components/AddTaskDialog.tsx`

1. Importar `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem` de `@/components/ui/command`
2. Importar `Check`, `ChevronsUpDown` de `lucide-react`
3. Substituir o bloco do Select de tipo (linhas ~161-180) por um Popover+Command:
   - Botão trigger mostrando o label do tipo selecionado
   - Campo de busca no topo do dropdown
   - Lista filtrada de tipos
   - Item "+ Criar novo tipo" no final
   - Check icon no item selecionado

Sem alterações no banco de dados.

