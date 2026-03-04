

## Plano: Igualar filtros da pagina Squads ao estilo da pagina Clientes

### Diferenca atual

| Aspecto | ClientsPage | Squads (Step 2) |
|---------|-------------|-----------------|
| Dropdowns | `<select>` nativo com classes Tailwind | Radix `<Select>` com `SelectTrigger/Content` |
| Datas | `<input type="date">` nativo | `<Input type="date">` component |
| Saude labels | Saudavel/Atencao/Critico/Nao avaliado | Verde/Amarelo/Vermelho/Branco |
| Botao limpar data | Presente com icone X | Ausente |
| Pipeline tabs | Com botao de deletar status (X hover) | Sem botao de deletar nos tabs |

### Mudancas em `src/pages/ProjectsPage.tsx` (linhas ~426-512)

**1. Substituir Radix Selects por `<select>` nativos** (mesmo estilo da ClientsPage):
- Responsavel: `<select>` com classe `px-3 py-2 text-sm bg-card border border-border rounded-lg...`
- Saude: mesmas opcoes da ClientsPage (Saudavel/Atencao/Critico/Nao avaliado com emojis)
- Plataforma: `<select>` nativo
- Datas: `<input type="date">` nativo com botao X para limpar

**2. Atualizar labels de saude** para corresponder a ClientsPage:
- "Verde" → "Saudavel", "Amarelo" → "Atencao", "Vermelho" → "Critico", "Branco" → "Nao avaliado"

**3. Adicionar botao X para limpar datas** (como na ClientsPage)

**4. Adicionar botao de deletar status nos pipeline tabs** (hover com X, como na ClientsPage)

Nenhuma migracao necessaria.

