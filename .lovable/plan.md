

## Confirmacao de Politica — Acesso Global

---

### Decisao registrada

**Regra oficial:** Todos os usuarios autenticados veem todos os clientes, squads e dados operacionais. Dados financeiros (monthlyRevenue, setupFee, MRR) sao restritos a admin (accessLevel === 3).

### Validacao do estado atual

O sistema **ja esta alinhado** com esta decisao. Nenhuma mudanca de codigo e necessaria.

**Evidencias:**

| Ponto | Status | Evidencia |
|---|---|---|
| `getVisibleClients()` retorna todos os clientes | OK | `ClientsContext.tsx` L107-110: retorna `clients` sem filtro |
| MRR no Dashboard restrito a admin | OK | `DashboardPage.tsx`: cards financeiros com `isAdmin` guard |
| Mensalidade/Setup nos cards de cliente | OK | `ClientsPage.tsx` L422-437: `{isAdmin && ...}` |
| Campos financeiros no modal de edicao | OK | `ClientDetailModal.tsx` L366-374: inputs envoltos em `isAdmin` |
| Campo financeiro em modo leitura | OK | `ClientDetailModal.tsx` L473: `{isAdmin && <ReadOnlyField ...>}` |

### Risco aceito

O payload JSON de `useClientsQuery` ainda inclui `monthly_revenue` e `setup_fee` para todos os usuarios autenticados (a query faz `select('*')`). A protecao e apenas visual (frontend). Como todos sao colaboradores internos, este risco e **aceito** conforme a decisao do usuario.

### Pendencia resolvida

A contradicao entre `global-access-policy` e `squad-visibility-rules` esta oficialmente resolvida: **a politica global prevalece**. A memory `squad-visibility-rules` deve ser atualizada para refletir que o isolamento por squad NAO se aplica — todos veem tudo.

### Nenhuma alteracao de codigo necessaria

O sistema ja implementa exatamente esta politica.

