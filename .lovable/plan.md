

## Plano: Liberar acesso total para todos os usuários (exceto página Admin)

### Situação atual

Existem restrições baseadas em `accessLevel === 3` espalhadas pelo sistema que limitam funcionalidades para usuários não-admin:

1. **Visibilidade de dados filtrada por squad** — `ClientsContext`, `AuthContext`, `ProjectsPage`, `ProductivityPage` filtram clientes/squads/membros por squad do usuário
2. **Campos financeiros ocultos** — Mensalidade, MRR, Setup, Faturamento por plataforma ficam escondidos no Dashboard, ClientDetailModal, ClientCard, AddPlatformSquadDialog
3. **Exclusão de demandas restrita** — Só admin ou líder do squad pode deletar tasks (ProjectsPage, TasksPage)
4. **Membros visíveis filtrados** — AddDemandDialog mostra apenas membros dos squads do usuário
5. **Página Admin** — Corretamente restrita a accessLevel 3 (sidebar + Index.tsx)

### Alterações

Remover todas as restrições de `isAdmin`/`accessLevel` **exceto** a visibilidade da página Admin (Settings) no sidebar e no Index.tsx.

**Arquivos a alterar:**

| Arquivo | O que muda |
|---|---|
| `src/contexts/ClientsContext.tsx` | `getVisibleClients` retorna todos os clientes sempre |
| `src/contexts/AuthContext.tsx` | `getVisibleClients` retorna todos os clientes sempre |
| `src/pages/ProjectsPage.tsx` | `visibleSquads` mostra todos; `canDel` sempre true para autenticados |
| `src/pages/TasksPage.tsx` | `canDel` sempre true para autenticados |
| `src/pages/DashboardPage.tsx` | Mostrar MRR e gráfico de receita para todos |
| `src/pages/ProductivityPage.tsx` | Mostrar todos os team members |
| `src/pages/ClientsPage.tsx` | Passar `isAdmin={true}` ou remover a prop e sempre mostrar tudo |
| `src/components/ClientDetailModal.tsx` | Mostrar campos financeiros para todos |
| `src/components/AddPlatformSquadDialog.tsx` | Mostrar campo faturamento para todos |
| `src/components/AddDemandDialog.tsx` | Mostrar todos os membros de todos os squads |
| `src/components/EditPlatformDialog.tsx` | Remover restrição de isAdmin se houver |

**Não alterar:**
- `src/components/AppSidebar.tsx` — manter botão Admin visível só para accessLevel 3
- `src/pages/Index.tsx` — manter redirect de Settings para Dashboard se não admin

