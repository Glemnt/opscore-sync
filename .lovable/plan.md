

## Plano: Confirmacao antes de remover plataforma

Adicionar um `AlertDialog` de confirmacao ao botao "Remover" no dialog de gerenciamento de plataformas.

### Mudancas em `src/pages/ProjectsPage.tsx`

**1. Adicionar estado para controlar a plataforma a ser removida:**
- `platformToRemove: { slug: string; cpId: string | undefined } | null`

**2. Substituir o onClick direto do botao "Remover"** por `setPlatformToRemove({ slug: platform.slug, cpId: cpRecord?.id })`

**3. Adicionar `AlertDialog` dentro do dialog de gerenciamento:**
- Titulo: "Remover plataforma"
- Descricao: "Tem certeza que deseja remover {nome da plataforma} deste cliente? Esta acao nao pode ser desfeita."
- Botao "Cancelar" e botao "Remover" (destructive)
- No confirmar: executa a logica atual de remocao e limpa o estado

Usa os componentes `AlertDialog` ja existentes no projeto (`src/components/ui/alert-dialog.tsx`).

