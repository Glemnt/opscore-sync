

## Plano: Botao para adicionar plataforma no Kanban de plataformas

### Problema
Na tela de plataformas (Step 2.5), o Kanban mostra apenas as plataformas ja associadas ao cliente. Nao existe botao para adicionar uma nova plataforma.

### Solucao

**Arquivo: `src/pages/ProjectsPage.tsx`**

1. Importar `useAddClientPlatform` (ja importado `useUpdateClientPlatform` na linha 25 — basta adicionar ao import).

2. Adicionar estado para o dialog de adicionar plataforma:
   - `addPlatformDialogOpen` (boolean)
   - `newPlatformSlug` (string)

3. Adicionar um botao "Adicionar Plataforma" ao lado do botao "Ver Todos" (ou abaixo do header), mostrando um icone `+` com texto. Filtrar as opcoes do select para mostrar apenas plataformas que o cliente ainda nao possui.

4. No dialog, ao confirmar:
   - Chamar `addClientPlatformMut.mutate({ clientId, platformSlug, ... })` para criar o registro em `client_platforms`
   - Chamar `updateClientField(clientId, 'platforms', [...currentPlatforms, newSlug])` para atualizar o array `platforms` do cliente

5. O novo card aparecera automaticamente na coluna "Onboarding" (fase padrao).

### Detalhes tecnicos

- O select mostra `platformOptions.filter(p => !selectedClient.platforms.includes(p.slug))` para evitar duplicatas
- A plataforma e criada na primeira coluna do Kanban por padrao (phase = primeira coluna ou 'onboarding')

