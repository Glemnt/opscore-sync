

## Visão por Plataforma dentro do Squad → Cliente

### Problema
Quando um cliente tem múltiplas plataformas (Mercado Livre, Shopee, Shein), cada uma avança em ritmos diferentes. Hoje, ao clicar num cliente dentro do Squad, vão direto para os projetos sem distinção de plataforma, impossibilitando gerenciar e transferir o trabalho por plataforma.

### Solução
Adicionar um nível intermediário entre a seleção do cliente e a visualização de projetos. Ao clicar num cliente dentro do Squad, o usuário verá:

1. **Painel de plataformas do cliente** — cards para cada plataforma associada ao cliente, mostrando quantos projetos/demandas existem para aquela plataforma
2. **Opção "Ver Todos"** — para continuar vendo todos os projetos sem filtro (comportamento atual)
3. **Ao selecionar uma plataforma** — filtra projetos e demandas apenas daquela plataforma

```text
Squads → Squad X → Clientes (kanban) → Cliente Y
                                          ├── [Todas] → projetos sem filtro
                                          ├── [Mercado Livre] → projetos filtrados
                                          ├── [Shopee] → projetos filtrados
                                          └── [Shein] → projetos filtrados
```

### Alterações em `src/pages/ProjectsPage.tsx`

**1. Novo estado**
- `selectedPlatform: string | null` — `null` = mostrar painel de plataformas, `'all'` = todos, ou o slug da plataforma selecionada

**2. Novo nível intermediário (Step 2.5)**
Após selecionar o cliente (`selectedClient` definido) e antes de mostrar projetos, se `selectedPlatform === null`:
- Exibir header com nome do cliente e botão "Voltar"
- Grid de cards: um card por plataforma do cliente (usando `client.platforms` + dados de `usePlatformsQuery`)
- Cada card mostra: ícone, nome da plataforma, contagem de projetos/demandas daquela plataforma
- Card "Ver Todos" para acessar a visão completa sem filtro
- Badge com plataformas no card do cliente no kanban para visibilidade rápida

**3. Filtro de projetos por plataforma (Step 3 existente)**
Quando `selectedPlatform` for definido (não null), a variável `filtered` passa a incluir filtro pela plataforma selecionada no campo `platform` dos tasks/projects. Como a tabela `projects` não tem campo `platform`, o filtro será aplicado nas **demandas** (tasks) que têm `platform[]`. Os projetos serão mostrados se possuírem pelo menos uma demanda com aquela plataforma.

**4. Botão "Voltar" ajustado**
- Se `selectedPlatform !== null`: voltar limpa `selectedPlatform` (volta ao painel de plataformas)
- Se `selectedPlatform === null`: voltar limpa `selectedClient`

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ProjectsPage.tsx` | Novo estado `selectedPlatform`, novo painel intermediário de plataformas, filtro de projetos por plataforma, ajuste na navegação de volta |

