

## Vincular membros dos Squads aos colaboradores de Configurações

### Problema atual
Na página de Squads, os membros são digitados manualmente como texto livre (campo "Membros separados por vírgula"). Não há vínculo com os colaboradores cadastrados em Configurações (`app_users`).

### Solução
Substituir o campo de texto livre por um seletor multi-select que lista os `app_users` cadastrados. O campo `leader` também passará a ser um select dos colaboradores.

### Arquivos a editar

| Ação | Arquivo |
|------|---------|
| Editar | `src/pages/ProjectsPage.tsx` — substituir inputs de texto (líder e membros) por selects baseados em `app_users` |

### Implementação

**1. `src/pages/ProjectsPage.tsx` — Dialog de criação/edição de Squad**
- Importar `useAppUsersQuery` para obter a lista de colaboradores
- Substituir o `<Input>` de "Líder" por um `<Select>` com as opções dos `app_users`
- Substituir o `<Input>` de "Membros (separados por vírgula)" por uma lista de botões toggle (chips) — um para cada `app_user` — similar ao padrão já usado no `SettingsPage` para selecionar squads
- O `squadLeader` passa a armazenar o **nome** do colaborador selecionado (mantendo compatibilidade com o campo `leader text` do banco)
- O `squadMembers` passa a ser um array de nomes selecionados via chips
- O líder selecionado é automaticamente incluído na lista de membros

### Detalhes técnicos
- A tabela `squads` armazena `leader text` e `members text[]` — continuará usando nomes como strings, sem necessidade de migration
- Os `app_users` são lidos via `useAppUsersQuery` que já existe e retorna `AppUserProfile[]` com campo `name`
- O ID do squad gerado em `addSquad` usa `sq_${Date.now()}` — isso deveria ser UUID, mas é um bug separado (a coluna `squads.id` é `uuid`)

