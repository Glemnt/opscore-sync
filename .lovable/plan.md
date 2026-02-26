

## Plano: Adicionar aba "Editar Template" no dialog de demanda

### Alteracao

**Arquivo: `src/components/AddDemandDialog.tsx`**

- Adicionar um 4o tab "Editar Template" ao `TabsList` com valor `edit_template`
- Atualizar o tipo do state `mode` para incluir `'edit_template'`
- Na aba "Editar Template":
  - Listar todos os templates customizados criados pelo usuario
  - Ao clicar num template, carregar o formulario de edicao (mesmo formulario do criar template) com nome e subtarefas preenchidos
  - Permitir alterar titulo, adicionar/remover subtarefas
  - Botao "Atualizar Template" para salvar as alteracoes
  - Botao de excluir template (icone Trash2) ao lado de cada item
  - Se nao houver templates customizados, exibir mensagem "Nenhum template criado ainda"
- Templates padrao (fixos) nao aparecem para edicao

### Resumo

| Arquivo | Alteracao |
|---|---|
| `src/components/AddDemandDialog.tsx` | Nova aba "Editar Template" com listagem e formulario de edicao inline |

