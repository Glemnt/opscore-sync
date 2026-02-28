

## Controle de acesso: Admin-only Settings + Filtro por Squad

### Situação atual
- A página Settings já é restrita no sidebar (`accessLevel === 3`), mas a rota em `Index.tsx` também tem essa verificação. Isso está OK.
- O filtro por squad já existe em `ClientsContext.getVisibleClients()` e `TasksPage` filtra tasks por `visibleClientIds`.
- **Problema**: `DashboardPage`, `ProductivityPage` e `ReportsPage` provavelmente **não filtram** dados pelo squad do usuário.
- A página de Squads (`ProjectsPage`) mostra **todos** os squads — usuários não-admin devem ver apenas os seus.

### Correções necessárias

**1. `src/pages/ProjectsPage.tsx` — Filtrar squads visíveis**
- Usuários não-admin (`accessLevel < 3`) veem apenas os squads cujos IDs estão em `currentUser.squadIds`
- Ocultar botões de criar/editar/excluir squad para não-admins (gestão de squads é admin-only)

**2. `src/pages/DashboardPage.tsx` — Filtrar dados por squad**
- Usar `getVisibleClients()` para filtrar clientes
- Filtrar tasks e projetos pelos clientes visíveis
- Métricas e gráficos devem refletir apenas dados do squad do usuário

**3. `src/pages/ProductivityPage.tsx` — Filtrar por squad**
- Filtrar team members e tasks pelos squads do usuário

**4. `src/pages/ReportsPage.tsx` — Filtrar por squad**
- Relatórios devem considerar apenas clientes/tasks/projetos visíveis

**5. `src/pages/Index.tsx` — Reforçar bloqueio do Settings**
- Já existe verificação `accessLevel === 3` — manter como está

**6. `src/components/AppSidebar.tsx` — Já oculta Settings para não-admin**
- Sem mudanças necessárias

### Resumo das mudanças por arquivo

| Arquivo | Mudança |
|---------|---------|
| `ProjectsPage.tsx` | Filtrar squads por `currentUser.squadIds`; ocultar CRUD de squads para não-admin |
| `DashboardPage.tsx` | Usar `getVisibleClients()` para filtrar todos os dados/métricas |
| `ProductivityPage.tsx` | Filtrar dados por squad do usuário |
| `ReportsPage.tsx` | Filtrar dados por squad do usuário |

