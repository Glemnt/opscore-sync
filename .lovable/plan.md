

## Corrigir dropdown de responsável -- dados de squad_ids vazios

### Problema raiz
O dropdown de responsável já está implementado corretamente no código (filtra por squad), mas **não funciona na prática** porque quase todos os `app_users` têm `squad_ids` vazio (`[]`). Os IDs reais dos squads são `26a8effd-...` (Time Pantera) e `98710a6d-...` (Time Aguia), mas nenhum usuário tem esses IDs no seu array `squad_ids`. Resultado: o dropdown aparece vazio.

### Solução

Duas mudanças:

1. **Melhorar o fallback no filtro** (em `AddTaskDialog.tsx` e `TaskDetailModal.tsx`): quando o filtro por squad retorna zero resultados, mostrar todos os `app_users` como fallback em vez de uma lista vazia. Isso garante que o usuário sempre consiga selecionar alguém, mesmo que os squad_ids ainda não estejam configurados.

2. **Atualizar os `squad_ids` dos usuários no banco**: os colaboradores precisam ter os IDs corretos dos squads associados. Isso pode ser feito pela página de Configurações (edição de usuários), onde o campo de squads já existe. Mas para funcionar imediatamente, vou ajustar o código para que, se o filtro por squad não encontrar ninguém, mostre todos os colaboradores disponíveis.

### Alterações

**`src/components/AddTaskDialog.tsx`** e **`src/components/TaskDetailModal.tsx`**:
- Alterar o `responsibleOptions` para: filtrar por squad, mas se o resultado for vazio, retornar todos os `appUsers` como fallback
- Código: `const filtered = appUsers.filter(...); return filtered.length > 0 ? filtered : appUsers;`

Isso resolve o problema imediato sem precisar corrigir dados manualmente.

