

## Adicionar badges de plataformas nos cards dos clientes no kanban do Squad

### Alteração em `src/pages/ProjectsPage.tsx`

No card do cliente no kanban (linhas ~444-454), após o segmento e antes dos contadores de projetos, inserir badges das plataformas associadas ao cliente.

**Código a inserir** (após linha 448, `<p>...segment...</p>`):

```tsx
{client.platforms && client.platforms.length > 0 && (
  <div className="flex flex-wrap gap-1 mb-2">
    {client.platforms.map((slug) => {
      const plat = platformOptions.find(p => p.slug === slug);
      return (
        <span key={slug} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 font-medium">
          <ShoppingBag className="w-2.5 h-2.5 shrink-0" />
          {plat?.name ?? slug}
        </span>
      );
    })}
  </div>
)}
```

- `ShoppingBag` e `platformOptions` já estão importados/disponíveis no componente
- Badges compactos (text `10px`) para não sobrecarregar o card
- Mesmo padrão visual usado no modal de detalhes do cliente

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ProjectsPage.tsx` | Inserir badges de plataformas no card do cliente no kanban (~linha 448) |

