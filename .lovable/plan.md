

## Plano: Corrigir Bug de Tela Branca na Area de Tarefas/Demandas

### Problema

O time reporta tela branca ao tentar subir tarefas, ver demandas ou acessar acoes relacionadas. Nao foi possivel reproduzir como admin, o que indica que o problema pode ser intermitente, relacionado a dados especificos, ou a ausencia de tratamento de erros que transforma qualquer crash em tela branca silenciosa.

### Causa raiz identificada

1. **Ausencia de Error Boundary** — o app nao tem nenhum React Error Boundary. Qualquer erro de runtime em qualquer componente resulta em tela branca sem feedback ao usuario.

2. **Crash potencial em `cp.phase.toLowerCase()`** (ProjectsPage.tsx, linha 217) — se alguma plataforma tiver `phase` como `null` ou `undefined`, o `.toLowerCase()` lanca TypeError e a pagina inteira quebra.

3. **`return null` em transicao de estado** (ProjectsPage.tsx, linha 878) — quando `selectedPlatform === null` e `selectedClient` existe, o componente retorna `null` momentaneamente enquanto define o `selectedPlatform`. Isso pode causar flash de tela branca.

4. **Sem loading states** — quando dados de `taskStatuses` ou `clientPlatformsData` estao carregando, nao ha indicador visual.

### Solucao

#### 1. Adicionar Error Boundary global

Criar `src/components/ErrorBoundary.tsx` com:
- Captura de erros em `componentDidCatch`
- UI de fallback com botao "Tentar novamente"
- Wrap no componente `AppContent` em `Index.tsx`

#### 2. Corrigir null safety em `cp.phase`

Em `src/pages/ProjectsPage.tsx`, linha 217:
```
// De:
cp.phase.toLowerCase().includes('churn')
// Para:
(cp.phase ?? '').toLowerCase().includes('churn')
```

E em `src/hooks/useClientPlatformsQuery.ts`, na funcao `mapRow`:
```
phase: row.phase ?? 'onboarding',
```

#### 3. Eliminar `return null` na transicao de estado

Em `src/pages/ProjectsPage.tsx`, linhas 874-878, substituir:
```tsx
if (selectedPlatform === null) {
    const firstPlatform = (selectedClient.platforms ?? [])[0];
    setSelectedPlatform(firstPlatform ?? 'all');
    return null; // <- causa tela branca momentanea
}
```
Por um useEffect que faca a mesma logica sem retornar null.

#### 4. Adicionar loading states

Em `TasksPage.tsx` e `ProjectsPage.tsx`, mostrar skeleton/spinner quando `isLoading` for true nos hooks de query.

### Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/components/ErrorBoundary.tsx` | Novo componente Error Boundary |
| `src/pages/Index.tsx` | Wrap com ErrorBoundary |
| `src/pages/ProjectsPage.tsx` | Fix null safety em `cp.phase`, eliminar `return null`, loading state |
| `src/hooks/useClientPlatformsQuery.ts` | Default `phase` para `'onboarding'` |
| `src/pages/TasksPage.tsx` | Loading state |

