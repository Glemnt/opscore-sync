

## Plano: Unificar nome do cliente e plataforma em uma linha

### Alteracao

**`src/pages/ProjectsPage.tsx` — linhas 683-688**

Substituir o titulo em duas linhas (nome do cliente + plataforma abaixo) por uma unica linha no formato "Nome do Cliente - Plataforma":

```tsx
// De:
<h3>...</h3>{client.name}</h3>
<p className="text-xs text-muted-foreground truncate">{platformName}</p>

// Para:
<h3>...</h3>{client.name} - {platformName}</h3>
// (remove o <p> da plataforma)
```

