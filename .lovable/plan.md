

## Plano: Adicionar "Gerar Demandas Automáticas" no dropdown de Fluxos (Step 3 - Squads)

### O que muda

**`src/pages/ProjectsPage.tsx`**

- No dropdown "Fluxos" do step 3 (linha 891-901), adicionar uma nova opção **"Gerar Demandas da Fase"** que abre o `GenerateDemandsDialog` já existente
- Detectar automaticamente a fase da plataforma atual do cliente usando `clientPlatformsData` (buscar o `client_platform` correspondente ao `selectedClient.id` + `selectedPlatform`)
- Setar o `generateTarget` com `phase`, `clientId`, `clientName`, `platformSlug` e `squadId` automaticamente ao clicar
- O dialog `GenerateDemandsDialog` já existe e faz exatamente o que o usuário quer: lista templates da fase, pede apenas responsável e prazo

### Detalhes técnicos

No step 3, antes do return, calcular a fase da plataforma:
```tsx
const currentPlatformData = clientPlatformsData.find(
  cp => cp.clientId === selectedClient.id && cp.platformSlug === selectedPlatform
);
const currentPhase = currentPlatformData?.phase ?? 'onboarding';
```

Adicionar item no dropdown:
```tsx
<DropdownMenuItem onClick={() => setGenerateTarget({
  phase: currentPhase,
  clientId: selectedClient.id,
  clientName: selectedClient.name,
  platformSlug: selectedPlatform ?? '',
  squadId: selectedClient.squadId ?? null,
})}>
  <Zap className="w-4 h-4 mr-1" />
  Gerar Demandas da Fase
</DropdownMenuItem>
```

O `GenerateDemandsDialog` já é renderizado no step 3 (linhas 948-960), então não precisa adicionar novo JSX -- apenas garantir que o `generateTarget` esteja acessível.

### Arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/pages/ProjectsPage.tsx` | Adicionar item no dropdown + calcular fase da plataforma |

Nenhuma mudança de banco de dados.

