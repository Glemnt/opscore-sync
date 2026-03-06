

## Plano: Editar e Excluir plataformas no Kanban de Times

### Situacao atual

Os cards de plataforma no Kanban possuem apenas o botao "Transferir". Nao ha opcao de editar os dados (responsavel, saude, origem, vendedor, data de onboarding, tipo de cliente) nem de excluir a plataforma diretamente pelo card.

### Alteracoes em `src/pages/ProjectsPage.tsx`

**1. Botao de excluir no card da plataforma (ao lado do botao de transferir)**
- Adicionar um botao com icone `Trash2` no footer do card
- Ao clicar, abrir um `AlertDialog` de confirmacao antes de excluir
- A exclusao usa `deleteClientPlatformMut` (ja disponivel) e tambem remove o slug do array `platforms` do cliente

**2. Botao de editar no card da plataforma**
- Adicionar um botao com icone `Pencil` no footer do card
- Ao clicar, abrir um Dialog de edicao pre-preenchido com os dados atuais da plataforma:
  - Tipo de Cliente (Seller/Lojista)
  - Data de Onboarding
  - Origem
  - Responsavel pelo Onboarding
  - Vendedor Responsavel
  - Saude da Plataforma
- O dialog usa `updatePlatformMut` (ja disponivel) para salvar as alteracoes

**3. Novos estados necessarios**
- `editingPlatform`: armazena os dados do `ClientPlatform` sendo editado (ou `null`)
- `deletingPlatform`: armazena `{ id, slug, clientId }` para confirmacao de exclusao (ou `null`)

A estrutura do dialog de edicao seguira o mesmo padrao visual do `AddPlatformSquadDialog` (botoes de selecao para tipo/saude, datepicker, dropdowns para responsaveis).

