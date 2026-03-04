

## Plano: Corrigir dialogs de Gerar Demandas e Transferir Plataforma

### Problema
Os dialogs `GenerateDemandsDialog` e `TransferPlatformDialog` nunca aparecem porque estão renderizados no bloco `return` final do componente (linha 902-922), mas os botões que ativam o estado estão no bloco `return` do step 2.5 (linha 615-808). Como o step 2.5 faz um `return` antecipado, o código nunca chega à renderização dos dialogs.

### Solução

**Arquivo: `src/pages/ProjectsPage.tsx`**

Mover os dois blocos de renderização condicional dos dialogs (`generateTarget` e `transferTarget`) para dentro do bloco `return` do step 2.5, logo antes do `</div>` final (linha ~807), envolvendo tudo em um fragment `<>...</>`:

```tsx
// Antes do fechamento do return do step 2.5 (linha 808):
return (
  <>
    <div className="p-6 animate-fade-in">
      {/* ... conteúdo existente do step 2.5 ... */}
    </div>

    {generateTarget && (
      <GenerateDemandsDialog ... />
    )}
    {transferTarget && (
      <TransferPlatformDialog ... />
    )}
  </>
);
```

Nenhuma outra mudança necessária. A renderização no bloco final (linha 902-922) pode ser mantida para cobrir o step 3, ou removida se não houver botões lá.

