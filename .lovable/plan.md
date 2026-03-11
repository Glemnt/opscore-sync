

## Plano: Adicionar badges numéricos nas abas de status da página de Clientes

### Alteração em `src/pages/ClientsPage.tsx` (linhas 182-212)

Adicionar contagem de clientes em cada aba de status, usando `clients` (lista completa, sem filtro de status) para contar:

- **Aba "Todos"**: mostrar `clients.filter(c => c.status !== 'inactive').length`
- **Abas de status**: para cada `f`, contar `clients.filter(c => c.status === f.value).length`
- **Formato**: `<span>` inline após o label, com estilo condicional — pill quando ativo (`bg-primary-foreground/20 rounded-full px-1.5`), opacity quando inativo (`opacity-70`)

Mesmo padrão visual já implementado na página de Squads.

