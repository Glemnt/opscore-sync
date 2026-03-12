

## Plano: Resumo visual por plataforma + filtro interativo na tela do Squad

### Situacao atual

- O **responsavel** ja aparece no card (linha 620) e ja e editavel na criacao e edicao.
- O **filtro por plataforma** ja existe como dropdown (linha 496-503) mas **sem contagem**.
- O **filtro por responsavel** ja existe com contagem (linha 472-482).
- Falta uma **barra visual de resumo** mostrando quantas plataformas de cada tipo existem no squad.

### O que sera feito

**1. Adicionar barra de resumo por plataforma (chips clicaveis com contagem)**

Entre os filtros (Row 1) e as abas de fase (Row 2), adicionar uma linha de chips visuais mostrando cada plataforma e sua contagem no squad. Exemplo:

```text
[ Mercado Livre (10) ] [ Shopee (7) ] [ Shein (5) ] [ TikTok Shop (2) ] [ Todas (24) ]
```

- Cada chip e clicavel e funciona como filtro (seta `squadPlatformFilter`)
- O chip ativo fica destacado com estilo primary
- A contagem e calculada a partir de `squadPlatformEntries` (fonte de verdade: `client_platforms`)
- Apenas plataformas que existem no squad aparecem (contagem > 0)

**2. Adicionar contagem ao dropdown de plataforma existente**

O `<select>` de Plataforma (linha 496-503) passara a mostrar contagem, igual ao de Responsavel:
```
Mercado Livre (10)
Shopee (7)
```

**3. Adicionar contagem ao card do Squad na listagem inicial**

No card de cada squad (linhas 262-266), alem de "X clientes" e "Y ativos", adicionar chips pequenos mostrando a distribuicao por plataforma:
```text
ML 10 | Shopee 7 | Shein 5
```

### Arquivo alterado

`src/pages/ProjectsPage.tsx`:
- **Card do squad** (~linha 262): adicionar chips de contagem por plataforma
- **Squad detail view** (~linha 534): inserir barra de chips clicaveis entre Row 1 e Row 2
- **Dropdown de plataforma** (~linha 496): adicionar contagem por opcao

Nenhuma alteracao de banco necessaria — todos os dados ja existem em `client_platforms`.

