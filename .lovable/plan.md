

## Plano: Unificar fase e reorganizar campos do EditPlatformDialog

### Analise

Existem dois campos de fase no dialog:
- **"Fase" (topo)** — salva em `clients.phase` (campo do cliente)
- **"Etapa da Plataforma" (baixo)** — salva em `client_platforms.phase` (campo da plataforma)

O Kanban de Squads filtra por `client_platforms.phase`. Quando o usuario edita a "Fase" de cima, ela atualiza `clients.phase` mas **nao** atualiza `client_platforms.phase` — o campo que o Kanban realmente usa. Isso causa a confusao e o bug de plataformas aparecendo em abas erradas.

### Correcoes em `EditPlatformDialog.tsx`

**1. Unificar o campo de fase**
- O campo "Fase" no topo passara a controlar `platformPhase` (que salva em `client_platforms.phase`)
- Remover o state `clientPhase` e o campo "Etapa da Plataforma" da secao inferior
- No `handleSubmit`, continuar enviando `phase: platformPhase` no update da plataforma, e sincronizar `phase: platformPhase` tambem no update do cliente para manter consistencia

**2. Mover "Responsavel da Plataforma" para a secao superior**
- Mover o select de responsavel da secao "Dados da Plataforma" para a secao "Dados do Cliente", posicionado logo apos o campo "Fase"

**3. Remover campo duplicado**
- Remover completamente o bloco de "Etapa da Plataforma" (linhas 302-307) da secao inferior

### Arquivo alterado

`src/components/EditPlatformDialog.tsx`

