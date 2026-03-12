

## Plano: Adicionar campo "Responsável da Plataforma" editável

### Situação atual

O campo `responsible` já existe na tabela `client_platforms` e já é exibido no card (linha 620 do ProjectsPage). O formulário de criação (`AddPlatformSquadDialog`) já permite definir o responsável como "Responsável pelo Onboarding".

**O que falta:** O `EditPlatformDialog` não inclui o campo `responsible` — só tem `salesResponsible` (Vendedor). Portanto, após a criação, não é possível alterar o responsável da plataforma.

### Alterações

**1. `EditPlatformDialog.tsx` — Adicionar campo editável de Responsável**
- Adicionar state `responsible` inicializado com `platform.responsible`
- Adicionar no `useEffect` de reset
- Incluir no `handleSubmit` → `updates.responsible`
- Renderizar um `<select>` com os `appUsers`, posicionado antes do "Vendedor Responsável"

**2. Renomear labels para clareza**
- No `AddPlatformSquadDialog`: "Responsável pelo Onboarding" → "Responsável da Plataforma"
- No `EditPlatformDialog`: novo campo com label "Responsável da Plataforma"
- Manter "Vendedor Responsável" como campo separado

Nenhuma alteração de banco de dados é necessária — o campo `responsible` já existe em `client_platforms`.

