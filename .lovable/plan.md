

## Plano: Fase da plataforma nos cards de clientes + Barra de pesquisa

### Problema
1. Na aba de **Clientes do Squad** (Step 2 - Kanban), os cards dos clientes mostram as plataformas associadas mas **não mostram a fase** em que cada plataforma está (Onboarding, Implementação, etc.)
2. Não há **barra de pesquisa** para encontrar clientes rapidamente nessa tela

### Alterações

**`src/pages/ProjectsPage.tsx`**

**1. Adicionar fase da plataforma nos badges do card do cliente (linhas ~471-487)**

Dentro do card do cliente no Kanban, onde cada plataforma é renderizada como badge, adicionar a fase operacional da plataforma ao lado do nome. A fase vem de `clientPlatformsData` (campo `phase`).

De:
```
🛒 Mercado Livre · Ouro · Full
```
Para:
```
🛒 Mercado Livre · Implementação · Ouro · Full
```

Lógica: buscar o `cp` (client_platform) correspondente e exibir `cp.phase` traduzido para label legível (usando um mapa: onboarding→Onboarding, implementacao→Implementação, escala→Escala, performance→Performance, active→Ativo, inativo→Inativo).

**2. Adicionar barra de pesquisa na aba de clientes do Squad (linhas ~350-363)**

Adicionar um campo de busca entre o `PageHeader` e o container do Kanban, filtrando `squadClients` por nome ou segmento. Usar estado `search` já existente no componente.

Inserir input com ícone `Search` e filtrar `colClients` com `client.name.toLowerCase().includes(search.toLowerCase())`.

Nenhuma mudança de banco de dados.

