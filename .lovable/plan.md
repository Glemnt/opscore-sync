

## Plano: Substituir dados de teste em `team_members` por colaboradores reais de `app_users`

### Situacao atual

- `team_members` contem 8 registros fictícios (Ana Silva, Beatriz Costa, etc.)
- `app_users` contem 13 colaboradores reais (Bianca Mansano, Felipe Alves, Isabel Chacale, etc.)

### Alteracoes

**1. Limpar tabela `team_members` e inserir colaboradores reais**

Usar o insert tool para:
- `DELETE FROM team_members` (remover dados de teste)
- `INSERT INTO team_members` com os nomes reais de `app_users`, usando o primeiro `squad_id` de cada usuario (quando disponivel), role correspondente, e `current_load = 0`

Colaboradores a inserir (excluindo contas Admin):
- Bianca Mansano (cs, squad 98710a6d)
- Felipe Alves (operacional, squad 26a8effd)
- Isabel Chacale (operacional, squad 98710a6d)
- Juan (operacional)
- Julia Ricotta (operacional)
- Leonardo Gorriti (operacional, squad 26a8effd)
- Milena Oliveira (operacional, squad 98710a6d)
- Renata (operacional, squad 98710a6d)
- Thiago Braganca (operacional, squad a0000000-...-0001)
- Vinicius Gabriel (operacional)
- Yasmin Ramos (operacional, squad 98710a6d)

**2. Nenhuma alteracao de codigo necessaria** — o Dashboard ja busca dados dinamicamente de `team_members`.

