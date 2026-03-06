

## Plano: Botao de criacao de cliente na pagina Squads (sem Tipo de Contrato e Setup Pago)

### Alteracoes

**1. `src/components/AddClientDialog.tsx`**
- Adicionar prop opcional `hideFields?: string[]` (ex: `['contractType', 'setupFee']`)
- Quando `hideFields` incluir `'contractType'`, ocultar o bloco de RadioGroup de Tipo de Contrato e usar valor padrao `'mrr'`
- Quando `hideFields` incluir `'setupFee'`, ocultar o campo Setup Pago (R$)
- Adicionar prop opcional `defaultSquadId?: string` para pre-selecionar o squad ao abrir pela pagina Squads

**2. `src/pages/ProjectsPage.tsx`**
- Adicionar estado `showAddClient` e importar `AddClientDialog`
- Inserir botao "Novo Cliente" no header da view de squad selecionado (ao lado do botao "Voltar aos Squads")
- Renderizar `<AddClientDialog open={showAddClient} onClose={...} hideFields={['contractType', 'setupFee']} defaultSquadId={selectedSquad.id} />`

