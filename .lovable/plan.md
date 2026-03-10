

## Plano: Alterar "Saúde do Cliente" para "Potencial do Cliente"

Alterar o campo no `src/components/EditPlatformDialog.tsx` (linhas 217-224):

1. Renomear label de "Saúde do Cliente" para "Potencial do Cliente"
2. Substituir as opções do dropdown para: Alto, Médio, Baixo (valores: `high`, `medium`, `low`)
3. Atualizar o state `clientHealthColor` → renomear para `clientPotential` e ajustar default, `useEffect` e `handleSubmit`

**Nota:** O campo continua gravando na coluna `healthColor` do cliente no banco (reaproveitando o campo existente), apenas mudando o significado semântico e as opções.

