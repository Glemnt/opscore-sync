

## Plano: Corrigir bug de mistura de plataformas entre squads ao alterar fase

### Causa raiz identificada

Analisei o fluxo completo e encontrei **duas causas** que podem provocar plataformas de outros times aparecendo indevidamente:

**Causa 1 — `EditPlatformDialog` altera o `squadId` do cliente inadvertidamente**

Quando o usuario edita uma plataforma (ex: muda fase de On-board para Performance), o `EditPlatformDialog` atualiza **tanto a plataforma quanto o cliente**. Na atualizacao do cliente (linha 161), envia `squadId: squadId || null`, onde `squadId` vem do dropdown do formulario. Se o squad do cliente era diferente do squad da plataforma, o squad do cliente pode ser sobrescrito. Isso nao causa o bug diretamente na listagem de plataformas (que filtra por `cp.squadId`), mas afeta a logica de visibilidade de clientes (`c.squadId === selectedSquad.id || clientIdsWithPlatformsInSquad.has(c.id)`).

**Causa 2 — Sync de plataformas cria registros no squad errado**

Linhas 125-146 do `EditPlatformDialog`: se o usuario acidentalmente altera a selecao de plataformas no formulario (toggle de chips), novos registros `client_platforms` sao criados com `squadId: squadId || null` — usando o squad do **cliente**, nao o squad da **plataforma sendo editada**. Isso pode criar uma plataforma em outro squad ou sem squad.

### Correcoes

**1. `EditPlatformDialog.tsx` — Nao alterar o squadId do cliente ao editar plataforma**

O squad do cliente nao deve ser alterado ao editar uma plataforma. Remover `squadId` do update do cliente, ou mante-lo readonly. O campo squad no formulario de edicao de plataforma deve controlar apenas a plataforma, nao o cliente.

**2. `EditPlatformDialog.tsx` — Usar o squadId da plataforma ao criar novas plataformas**

Quando novos registros `client_platforms` sao criados via sync de plataformas (linhas 131-136), usar `platform.squadId` em vez de `squadId` do formulario do cliente.

**3. `EditPlatformDialog.tsx` — Tornar o campo Squad do cliente readonly ou remover**

O campo Squad no formulario de edicao de plataforma controla `client.squadId`, mas isso nao faz sentido neste contexto — o usuario esta editando uma plataforma especifica, nao o cliente inteiro. Remover esse campo evita alteracoes acidentais.

### Arquivos alterados

`src/components/EditPlatformDialog.tsx`:
- No `handleSubmit`, remover `squadId` do objeto de updates do cliente (ou manter o valor original sem permitir edicao)
- No sync de plataformas adicionadas, usar `platform.squadId` em vez de `squadId` do formulario
- Remover ou tornar readonly o campo Squad no formulario

