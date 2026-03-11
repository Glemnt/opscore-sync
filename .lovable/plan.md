

## Plano: Adicionar badge numérico de contagem nas abas de fase

### Alteração em `src/pages/ProjectsPage.tsx` (linhas 511-543)

Adicionar a contagem de plataformas em cada aba:

- **Aba "Todos"**: mostrar `squadPlatformEntries.length` (total sem filtro de fase)
- **Abas de fase**: para cada `col`, contar `squadPlatformEntries.filter(e => e.cp.phase === col.status).length`
- **Formato**: `<span>` inline após o label, com estilo `ml-1.5 text-[10px] opacity-70` (ou `bg-primary-foreground/20 rounded-full px-1.5` quando ativo)

Exemplo visual: `Onboarding (12)` ou com badge pill.

Sem alterações de lógica ou banco de dados.

