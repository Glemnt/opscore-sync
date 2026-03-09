

## Plano: Modal de detalhes expandido para plataformas no Kanban de Squads

### Objetivo

Ao clicar em um card de plataforma no Kanban de Squads, abrir um modal de detalhes com 4 seções (igual ao modal de clientes):
1. **Análise por IA** — reutilizando o padrão de `ClientAIAnalysis` adaptado para plataforma
2. **Observações** — chat de notas via tabela `platform_chat_notes`
3. **Documentos** — upload/listagem via tabela `platform_documents` + bucket `platform-documents`
4. **Log de Alterações** — via tabela `platform_change_logs`

### Infraestrutura existente

As 3 tabelas (`platform_chat_notes`, `platform_change_logs`, `platform_documents`) e o bucket `platform-documents` já existem com RLS configurada. Nenhuma migração de banco necessária.

### Alterações

**1. Criar 3 hooks de dados**

- `src/hooks/usePlatformChatNotesQuery.ts` — query por `client_platform_id`, mutation de insert e delete
- `src/hooks/usePlatformChangeLogsQuery.ts` — query por `client_platform_id` (read-only)
- `src/hooks/usePlatformDocumentsQuery.ts` — query por `client_platform_id`, upload ao bucket `platform-documents`, insert/delete na tabela

**2. Criar componente `PlatformDetailModal.tsx`**

- `src/components/PlatformDetailModal.tsx`
- Props: `clientPlatform: ClientPlatform`, `client: Client`, `platformName: string`, `open/onClose`
- Layout do modal em seções colapsáveis:
  - **Header**: Nome do cliente + plataforma, badges de qualidade/saúde, responsável, squad
  - **Análise IA**: Edge function `platform-ai-analysis` chamando Lovable AI para gerar análise baseada em dados da plataforma (tarefas, notas, logs)
  - **Observações**: Lista de notas + input de envio (mesmo padrão do `ClientDetailModal` linhas 632-670)
  - **Documentos**: Lista de arquivos com upload, visualização e exclusão via Storage
  - **Log de Alterações**: Lista colapsável (mesmo padrão linhas 672-703)

**3. Criar edge function `platform-ai-analysis`**

- `supabase/functions/platform-ai-analysis/index.ts`
- Recebe `clientPlatformId`, busca dados da plataforma + notas + logs + tarefas relacionadas
- Chama Lovable AI (gemini-3-flash-preview) com prompt para gerar: score de satisfação, resumo operacional, próximos passos
- Retorna JSON estruturado (sem streaming, via tool calling)

**4. Atualizar `ProjectsPage.tsx`**

- Adicionar estado `expandedPlatformEntry: { cp, client, platformName } | null`
- No click do card (linha 695), em vez de navegar direto para demandas, abrir o `PlatformDetailModal`
- Manter dentro do modal um botão "Ver Demandas" que faz o `setSelectedClient + setSelectedPlatform` original
- Renderizar `<PlatformDetailModal>` no JSX

### Fluxo do usuário

```text
Card no Kanban → Click → PlatformDetailModal abre
  ├── Header (nome, badges, squad, responsável)
  ├── Análise IA (gerada via edge function)
  ├── Observações (chat notes)
  ├── Documentos (upload/download)
  ├── Log de Alterações (colapsável)
  └── Botão "Ver Demandas" → navegação existente
```

