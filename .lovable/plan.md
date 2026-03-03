

## Exibir Plataformas no modal de detalhes do Cliente

### Problema
Ao abrir o modal de detalhes de um cliente, as plataformas associadas não aparecem nas informações visíveis (modo visualização). Elas só são mostradas no formulário de edição.

### Solução
Adicionar uma seção "Plataformas" logo abaixo do grid de informações editáveis (após o grid de Entrada/Mensalidade/Squad/Responsável), exibindo as plataformas como badges — similar ao que já é feito no card do cliente na listagem.

### Alteração em `src/components/ClientDetailModal.tsx`

Após o grid editável (linha ~285), antes da seção "Saúde do Cliente" (linha ~288), inserir:

```tsx
{/* Plataformas */}
{client.platforms && client.platforms.length > 0 && (
  <div className="mt-3">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Plataformas</p>
    <div className="flex flex-wrap gap-1.5">
      {client.platforms.map((slug) => {
        const plat = platformOptions.find(p => p.slug === slug);
        return (
          <span key={slug} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-md px-2.5 py-1 font-medium">
            <ShoppingBag className="w-3 h-3 shrink-0" />
            {plat?.name ?? slug}
          </span>
        );
      })}
    </div>
  </div>
)}
```

- Usar o ícone `ShoppingBag` (já importado na página de clientes, precisa importar no modal)
- Reutilizar `platformOptions` que já é carregado no modal via `usePlatformsQuery`

