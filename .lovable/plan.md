

## Plano: Mostrar duração do contrato (6/12 meses) no card do cliente

### Problema
Atualmente, o campo `contractDurationMonths` só é preenchido quando o tipo de contrato é TCV. Para contratos MRR, o valor fica `undefined` e o card mostra "—". O usuário quer que a duração do contrato (6 ou 12 meses) seja sempre configurável, independente do tipo de contrato.

### Mudanças

**1. Formulário de criação (`src/components/AddClientDialog.tsx`)**:
- Remover a condição que esconde o campo "Duração do Contrato" apenas para TCV
- Tornar o campo sempre visível, com opções de 6 e 12 meses (remover 3 meses se não faz sentido)
- No `handleSubmit`, sempre incluir `contractDurationMonths: Number(contractDuration)` em vez de condicionar ao tipo TCV

**2. Modal de detalhe (`src/components/ClientDetailModal.tsx`)**:
- Garantir que o campo de duração do contrato também seja editável na visualização do cliente

O card (`ClientsPage.tsx`) já exibe corretamente com `{client.contractDurationMonths ? \`${client.contractDurationMonths}m\` : '—'}`, então não precisa de alteração no card.

