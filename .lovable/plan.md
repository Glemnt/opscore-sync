

## Plano: Mover plataformas com phase "escala" para "active"

### Situacao

Nao existe um status "Escala" cadastrado no board `squads` — a coluna aparece como "orfao" porque 4 registros em `client_platforms` possuem `phase = 'escala'`:

| Cliente | Plataforma |
|---------|-----------|
| Violeta Mabel | Shein |
| Jhomini Modas | Shein |
| MART TERRA (GABI) | Mercado Livre |
| SAO RIO MODA INTIMA | Mercado Livre |

### Solucao

Atualizar o campo `phase` dessas 4 plataformas de `'escala'` para `'active'` (Ativo). Isso elimina a coluna orfao e posiciona os cards na coluna correta.

Nenhuma alteracao de codigo necessaria.

