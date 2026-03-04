

## Plano: Remover botão Gerar Demandas do card + Auto-preencher cliente no AddTaskDialog

### Mudanças

**1. `src/pages/ProjectsPage.tsx`**

- **Remover o botão ⚡ "Gerar Demandas"** do footer do card de plataforma (linhas 787-795). Manter apenas o botão de transferência.
- **Passar `clientId`, `clientName` e `platformSlug` como props** para o `AddTaskDialog` usado no step 3 (linha 1114-1118), já que nesse contexto o cliente e plataforma são conhecidos (`selectedClient` e `selectedPlatform`).

**2. `src/components/AddTaskDialog.tsx`**

- Adicionar props opcionais: `defaultClientId?: string`, `defaultClientName?: string`, `defaultPlatformSlug?: string`
- Quando `defaultClientId` for fornecido:
  - Inicializar `clientId` com esse valor
  - **Esconder o seletor de Cliente** (linhas 168-179) -- exibir apenas o nome do cliente como texto estático
  - Auto-gerar o título com o cliente pré-selecionado
- Quando `defaultPlatformSlug` for fornecido:
  - Inicializar `selectedPlatforms` com `[defaultPlatformSlug]`
  - Esconder o seletor de plataformas (linhas 267-289) -- exibir apenas a plataforma como badge estática

Nenhuma mudança de banco de dados.

