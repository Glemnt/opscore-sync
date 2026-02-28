

## Correção: Adicionar Novo Cliente

### Problema
O `AddClientDialog` gera IDs no formato `c_${Date.now()}` (ex: `c_1709123456789`), mas a coluna `id` na tabela `clients` é do tipo `uuid`. O insert falha silenciosamente no banco de dados.

O mesmo problema ocorre com os IDs das tasks criadas automaticamente (`t_${Date.now()}_0`).

### Solução

**`src/components/AddClientDialog.tsx`**:
- Substituir `c_${Date.now()}` por `crypto.randomUUID()` para gerar UUIDs válidos
- Substituir `t_${Date.now()}_${idx}` por `crypto.randomUUID()` para tasks
- Substituir `st_${Date.now()}_${idx}_${i}` por `crypto.randomUUID()` para subtasks

### Mudanças
Apenas 3 linhas precisam ser alteradas no arquivo `AddClientDialog.tsx`:
- Linha 72: `const clientId = crypto.randomUUID();`
- Linha 114: `id: crypto.randomUUID(),`  
- Linha 108: `id: crypto.randomUUID(),`

