

## Plano: Mostrar apenas nome do cliente no header e plataforma como badge visual

### Alteração em `src/pages/ProjectsPage.tsx`

**Linha 711** — Remover `- {platformName}` do título, deixando apenas `{client.name}`

**Linhas 752-755** — O badge de plataforma já existe na seção de saúde. Nenhuma alteração necessária ali.

Resultado: o header mostra só "Delia Modas" e a plataforma continua visível como badge colorido abaixo.

