

## Fix: Corrigir mapeamento de keys no `client_statuses`

### Problema encontrado

A funcionalidade de alterar fase por plataforma **funciona corretamente** -- alterar a fase da Shopee não afetou Mercado Livre nem Shein. Porém, os dados no `client_statuses` têm keys que não correspondem aos labels:

```text
key: "churned"    → label: "Onboarding"     (deveria ser key: "onboarding")
key: "onboarding" → label: "Implementacao"   (deveria ser key: "implementacao")
key: "paused"     → label: "Escala"           (deveria ser key: "escala")
key: "active"     → label: "Ativo"            (ok)
key: "performance"→ label: "Performance"      (ok)
key: "inativo"    → label: "Inativo"          (ok)
```

Quando o sistema faz auto-seed com `phase: 'onboarding'`, o badge exibe "Implementacao" (porque esse é o label de key "onboarding"). Quando o usuario seleciona "Onboarding" no dropdown, salva key "churned".

### Solução

Corrigir os keys no `client_statuses` e atualizar todos os registros dependentes (`clients.status` e `client_platforms.phase`) que usam os keys antigos.

**Operações de dados (INSERT tool):**

1. Atualizar `client_statuses`:
   - `churned` → renomear key para `onboarding`, label "Onboarding"
   - `onboarding` → renomear key para `implementacao`, label "Implementacao"  
   - `paused` → renomear key para `escala`, label "Escala"

2. Atualizar `clients.status` onde usa keys antigos
3. Atualizar `client_platforms.phase` onde usa keys antigos

Alternativamente, se os keys foram intencionalmente reutilizados e há lógica no sistema dependendo deles (ex: `active`, `churned`, `paused` são usados em código), a solução é ajustar o default do auto-seed para usar o key correto que mapeia para "Onboarding" (que é `churned`).

### Abordagem recomendada

Verificar se existe código que depende dos keys literais (`churned`, `paused`, etc.) no `src/lib/config.ts` e no restante do codebase. Se os keys são puramente dinâmicos, renomear. Se há dependência hardcoded, ajustar o default do auto-seed.

| Ação | Detalhe |
|------|---------|
| Verificar `src/lib/config.ts` | Checar dependências hardcoded de keys |
| Corrigir dados ou defaults | Alinhar keys com labels ou ajustar auto-seed default |
| Atualizar `client_platforms` existentes | Migrar phases com keys antigos |

