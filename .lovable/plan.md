

## Plano: Remover campos do EditPlatformDialog

Remover os seguintes 7 campos do `src/components/EditPlatformDialog.tsx`:

1. **Setup Pago (R$)** — `setupFee`
2. **Mensalidade (R$)** — `monthlyRevenue`
3. **Tipo de Contrato** — `contractType`
4. **Dia de Pagamento** — `paymentDay`
5. **Responsável pelo Onboarding** — `responsible` (seção Dados da Plataforma)
6. **Nome** — `name`
7. **CNPJ** — `cnpj`

Remover os inputs, states e referências no `handleSubmit` correspondentes. Nenhuma alteração no banco.

