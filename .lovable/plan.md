

## Plano: Tornar seleção de fase obrigatória antes de gerar demandas

### Problema atual

O dialog abre com a fase já pré-selecionada (vinda do prop `phase`), então o usuário não percebe que precisa escolher uma fase. Além disso, mesmo sem fase válida, o conteúdo abaixo já aparece (mostrando "nenhum template" ou listando demandas).

### Alteração em `src/components/GenerateDemandsDialog.tsx`

1. **Inicializar `selectedPhase` como `''`** (vazio) em vez de usar o prop `phase` diretamente — forçar o usuário a escolher explicitamente

2. **Quando `selectedPhase` estiver vazio**: mostrar uma mensagem orientativa abaixo do select (ex: "Selecione uma fase da pipeline acima para visualizar e gerar as demandas") e esconder a lista de templates e o botão "Criar Demandas"

3. **Destacar visualmente o select** quando vazio — adicionar uma borda de destaque (ex: `ring-2 ring-primary`) para chamar atenção

4. **Botão "Criar" fica desabilitado** se `selectedPhase` estiver vazio (segurança adicional)

### Arquivo alterado

- `src/components/GenerateDemandsDialog.tsx`

