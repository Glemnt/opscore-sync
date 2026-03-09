

## Plano: Adicionar Análise IA, Observações, Documentos e Log de Alterações por Plataforma

### Objetivo
Replicar nas plataformas operacionais (dentro do `PlatformOperationalPanel`) as mesmas 4 funcionalidades que já existem no nível do cliente: Análise por IA, Observações colaborativas, Upload de documentos e Log de alterações.

### Alterações no Banco de Dados

**3 novas tabelas:**

1. **`platform_chat_notes`** — observações por plataforma
   - `id`, `client_platform_id` (uuid, ref client_platforms), `message`, `author`, `created_at`

2. **`platform_change_logs`** — log de alterações por plataforma
   - `id`, `client_platform_id` (uuid), `field`, `old_value`, `new_value`, `changed_by`, `changed_at`

3. **`platform_documents`** — documentos anexados por plataforma
   - `id`, `client_platform_id` (uuid), `file_name`, `file_path` (storage path), `uploaded_by`, `created_at`

**Storage bucket:** `platform-documents` (público para leitura autenticada)

**RLS:** Todas as tabelas com policies para authenticated users (select, insert, delete; update apenas em chat_notes).

### Novos Hooks

- `usePlatformChatNotesQuery(platformId)` — CRUD de observações
- `usePlatformChangeLogsQuery(platformId)` — leitura dos logs
- `usePlatformDocumentsQuery(platformId)` — CRUD de documentos

### Alterações de Código

**`src/hooks/useClientPlatformsQuery.ts`**
- No `useUpdateClientPlatform`, registrar automaticamente um change log na tabela `platform_change_logs` comparando valores antigos vs novos.

**`src/components/ClientDetailModal.tsx` — PlatformOperationalPanel**
- Dentro da seção expandida de cada plataforma, adicionar 4 novas seções após os campos de edição existentes:
  1. **Análise por IA** — Componente similar ao `ClientAIAnalysis`, adaptado para receber `clientPlatform` e tasks filtradas por plataforma
  2. **Observações** — Lista de notas + input para enviar (mesmo padrão do chat de notas do cliente)
  3. **Documentos** — Upload de arquivo para storage + listagem com visualizar/remover
  4. **Log de Alterações** — Botão colapsável com histórico (mesmo padrão do cliente)

**Novo componente: `src/components/PlatformAIAnalysis.tsx`**
- Adaptação do `ClientAIAnalysis` para contexto de plataforma, usando dados mock indexados por `clientPlatform.id`

### Fluxo de Dados

```text
PlatformOperationalPanel (expandido)
  ├── Campos de edição existentes (fase, squad, etc.)
  ├── PlatformAIAnalysis ← mock data por platform
  ├── Observações ← platform_chat_notes
  ├── Documentos ← platform_documents + storage bucket
  └── Log de Alterações ← platform_change_logs (auto-preenchido)
```

### Registro Automático de Logs

Quando `useUpdateClientPlatform` é chamado, antes de executar o update, buscar o registro atual e comparar campos alterados, inserindo uma linha em `platform_change_logs` para cada campo diferente. Campos mapeados: fase, squad, responsável, qualidade, saúde, etc.

