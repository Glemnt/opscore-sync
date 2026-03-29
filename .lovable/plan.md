

## Catalogo Mestre de Plataformas

### Resumo

Criar uma pagina admin "Plataformas" com catalogo mestre completo, substituindo a tabela simples `platforms` atual por uma `platform_catalog` com regras operacionais, checklists e prazos.

---

### 1. Migration — Tabela `platform_catalog`

Criar tabela com:
- `id uuid PK DEFAULT gen_random_uuid()`
- `name text NOT NULL`
- `slug text NOT NULL UNIQUE`
- `status text NOT NULL DEFAULT 'ativo'` (ativo/inativo)
- `prazo_onboarding integer NOT NULL DEFAULT 15`
- `prazo_implementacao integer NOT NULL DEFAULT 30`
- `checklist_obrigatorio jsonb NOT NULL DEFAULT '[]'` — array de `{id, label, etapa, bloqueia_passagem}`
- `tipos_demanda_permitidos text[] NOT NULL DEFAULT '{}'`
- `criterios_passagem text[] NOT NULL DEFAULT '{}'`
- `created_at timestamptz NOT NULL DEFAULT now()`

RLS: authenticated full CRUD (mesmo padrao das outras tabelas).

Seed das 4 plataformas com checklists conforme especificado (ML 10 itens, Shopee 7, Shein 5, TikTok 5).

---

### 2. Nova pagina — `src/pages/PlatformCatalogPage.tsx`

- Listagem em cards com nome, slug, status badge, contagem de checklist items, prazos
- Botao "Nova Plataforma" abre dialog de criacao
- Click no card abre dialog de edicao
- Botao de excluir com confirmacao

---

### 3. Dialog de criacao/edicao — `src/components/PlatformCatalogDialog.tsx`

Campos organizados:
- **Basico**: nome, slug (auto-gerado do nome), status
- **Prazos**: prazoOnboarding, prazoImplementacao (inputs numericos)
- **Checklist**: lista editavel de itens com label, etapa (select), bloqueiaPassagem (checkbox). Botoes adicionar/remover/reordenar
- **Tipos de demanda**: multi-select dos task_types cadastrados
- **Criterios de passagem**: lista editavel de strings

---

### 4. Hook — `src/hooks/usePlatformCatalogQuery.ts`

CRUD completo: `usePlatformCatalogQuery`, `useAddPlatformCatalog`, `useUpdatePlatformCatalog`, `useDeletePlatformCatalog`.

---

### 5. Navegacao

- Adicionar item "Plataformas" no `AppSidebar.tsx` (icone `Layers`), visivel apenas para accessLevel === 3
- Adicionar case `'platform-catalog'` no `renderPage()` de `Index.tsx`

---

### 6. Tabela `platforms` existente

Manter a tabela `platforms` simples como esta (usada em selects de cadastro). O `platform_catalog` e a fonte de verdade para regras operacionais. Futuramente podem ser unificadas, mas nao agora para evitar quebras.

---

### Arquivos

- `supabase/migrations/` — nova migration (CREATE TABLE + INSERT seed)
- `src/hooks/usePlatformCatalogQuery.ts` (novo)
- `src/pages/PlatformCatalogPage.tsx` (novo)
- `src/components/PlatformCatalogDialog.tsx` (novo)
- `src/components/AppSidebar.tsx` (add nav item)
- `src/pages/Index.tsx` (add route case)

