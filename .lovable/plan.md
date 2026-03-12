

## Plano: Corrigir visibilidade de squads para líderes

### Problema

A visibilidade de squads para non-admin é determinada exclusivamente por `currentUser.squadIds.includes(s.id)`. Se um usuário está definido como `leader` de um squad mas o ID desse squad não está no array `squadIds` do seu perfil, o squad não aparece para ele.

O campo `squad.leader` armazena o **nome** do usuário (string). A verificação precisa comparar `squad.leader === currentUser.name`.

### Locais afetados (5 pontos)

1. **`src/pages/ProjectsPage.tsx` linha 188** — `visibleSquads` filtra squads visíveis
2. **`src/contexts/ClientsContext.tsx` linha 98** — `getVisibleClients` filtra clientes por squad
3. **`src/contexts/AuthContext.tsx` linha 104** — `getVisibleClients` (duplicado)
4. **`src/components/AddDemandDialog.tsx` linha 78** — filtra membros por squads do usuário
5. **`src/components/AppSidebar.tsx` linha 45** — exibe nomes dos squads do usuário

### Solução

Em cada ponto, adicionar condição `OR` para incluir squads onde `squad.leader === currentUser.name`.

#### 1. `ProjectsPage.tsx` (linha 188)
```typescript
const visibleSquads = isAdmin ? squads : squads.filter((s) => 
  currentUser?.squadIds.includes(s.id) || s.leader === currentUser?.name
);
```

#### 2. `ClientsContext.tsx` (linha 98)
Precisa importar squads. Adicionar `useSquads` e filtrar clientes cujo squad o usuário lidera:
```typescript
const { squads } = useSquads();
const leaderSquadIds = new Set(squads.filter(s => s.leader === currentUser?.name).map(s => s.id));
return clients.filter((c) => currentUser.squadIds.includes(c.squadId) || leaderSquadIds.has(c.squadId));
```

#### 3. `AuthContext.tsx` (linha 104)
Mesma lógica — mas `AuthContext` não tem acesso a squads. Como `getVisibleClients` em `ClientsContext` já é usado em todas as páginas, a solução é: remover `getVisibleClients` do `AuthContext` (não é usado diretamente em nenhum lugar que não passe pelo `ClientsContext`) ou passar squads como parâmetro. Vou verificar se é usado diretamente.

Verificando: `AuthContext.getVisibleClients` é exportado mas `ClientsContext.getVisibleClients` é o que as páginas usam. O do AuthContext pode ser mantido como fallback simples ou removido. A correção principal é no `ClientsContext`.

#### 4. `AddDemandDialog.tsx` (linha 78)
```typescript
const userSquads = squads.filter((s) => currentUser.squadIds.includes(s.id) || s.leader === currentUser.name);
```

#### 5. `AppSidebar.tsx` (linha 45)
```typescript
const userSquadNames = currentUser
  ? squads.filter((s) => currentUser.squadIds.includes(s.id) || s.leader === currentUser.name).map((s) => s.name)
  : [];
```

### Resumo

A correção é estrutural e global: em todos os 5 pontos onde a visibilidade de squads é determinada, adicionar a condição `s.leader === currentUser.name`. Isso garante que qualquer colaborador definido como líder visualize seu squad, independentemente do array `squadIds`.

Sem alterações de banco de dados.

