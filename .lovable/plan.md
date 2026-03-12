

## Plano: Centralizar responsável apenas no card da plataforma

### Resumo

Remover o campo "Responsável" do nível do cliente em toda a aplicação e fazer com que o filtro de responsável use exclusivamente `client_platforms.responsible`.

### Alterações

#### 1. `src/pages/ClientsPage.tsx`
- **Linha 72**: Trocar `uniqueResponsibles` para buscar de `client_platforms` em vez de `clients`:
  ```typescript
  const { data: allClientPlatforms = [] } = useClientPlatformsQuery(); // já importado
  const uniqueResponsibles = [...new Set(allClientPlatforms.map(cp => cp.responsible).filter(Boolean))];
  ```
- **Linha 81**: Alterar `matchResponsible` para verificar se o cliente tem alguma plataforma com o responsável selecionado:
  ```typescript
  const matchResponsible = responsibleFilter === 'all' || allClientPlatforms.some(cp => cp.clientId === c.id && cp.responsible === responsibleFilter);
  ```
- **Linhas 384-389** (ClientCard): Remover o badge de `client.responsible` do card do cliente.

#### 2. `src/pages/ProjectsPage.tsx` (Squads)
- **Linha 397**: Remover `e.client.responsible` do `uniqueResponsibles`, manter apenas `e.cp.responsible`.
- **Linha 402**: Remover `e.client.responsible` do `matchResponsible`, manter apenas `e.cp.responsible`.

#### 3. `src/components/AddClientDialog.tsx`
- Remover o campo "Responsável" do formulário de criação de cliente (state `responsible`, select, e o campo `responsible` do payload de criação).

#### 4. `src/components/ClientDetailModal.tsx`
- **Linha 348-351**: Remover o campo "Responsável" do formulário de edição do cliente.
- **Linha 475**: Remover a linha `ReadOnlyField` de "Responsável" na visualização.
- **Linha 304**: Remover `responsible` do `editData` inicial.

#### 5. `src/components/EditPlatformDialog.tsx`
- **Linha 56**: Remover o state `clientResponsible` e o select de responsável na seção "Dados do Cliente".
- Remover `responsible: clientResponsible` do payload de `updateClientMut`.

### Sem alterações de banco

O campo `responsible` na tabela `clients` continua existindo no banco (evitar migration destrutiva), mas não será mais exibido nem usado como fonte de verdade. O campo `responsible` em `client_platforms` passa a ser a única fonte.

