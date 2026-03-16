

## Plano: Restringir MRR/faturamento apenas para Admins

### Problema

Na última alteração, `isAdmin` foi hardcoded como `true` em todos os arquivos. Agora o MRR e dados financeiros precisam voltar a ser restritos a admins (`accessLevel === 3`), enquanto todas as outras funcionalidades continuam abertas.

### Alterações

Em **5 arquivos**, trocar `const isAdmin = true` por `const isAdmin = currentUser?.accessLevel === 3`:

| Arquivo | Dados financeiros afetados |
|---|---|
| `src/pages/DashboardPage.tsx` | Card MRR, gráfico Receita por Plataforma |
| `src/pages/ClientsPage.tsx` | Mensalidade e Setup nos cards de clientes |
| `src/components/ClientDetailModal.tsx` | Campos Mensalidade e Setup no modal |
| `src/components/AddPlatformSquadDialog.tsx` | Campo faturamento ao adicionar plataforma |
| `src/components/EditPlatformDialog.tsx` | Campo faturamento ao editar plataforma |

Cada arquivo já importa `useAuth` e já usa `isAdmin` condicionalmente nos JSX — basta corrigir a definição da variável. Nenhuma outra lógica muda (visibilidade de clientes, squads, exclusão de demandas continuam liberadas para todos).

