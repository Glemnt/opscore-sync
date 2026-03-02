

## Selecionar responsável a partir dos colaboradores

### Problema
Atualmente o campo "Responsável" do cliente é um campo de texto livre. O usuário quer poder selecionar a partir da lista de colaboradores cadastrados (tabela `team_members`).

### Alterações

**1. `src/components/AddClientDialog.tsx`**
- Importar `useTeamMembersQuery`
- Adicionar estado `responsible`
- Substituir o campo fixo vazio por um `<select>` populado com os membros da equipe
- Incluir `responsible` no objeto `newClient` ao submeter

**2. `src/components/ClientDetailModal.tsx`**
- Importar `useTeamMembersQuery`
- No formulário de edição (editMode), trocar o `<Input>` do campo "Responsável" (linha 194) por um `<select>` com os colaboradores
- No `EditableField` do campo "responsible" (linha 259), transformar em select quando em modo de edição inline (similar ao que já é feito para `squadId`)

