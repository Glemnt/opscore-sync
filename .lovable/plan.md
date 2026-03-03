

## Plano: Substituir "Prazo" por "Tempo de Contrato" nas Plataformas

### Alterações

**Arquivo: `src/components/ClientDetailModal.tsx` (linhas 131-139)**

Substituir o campo de data "Prazo" por um dropdown "Tempo de Contrato" com duas opções: 6 meses e 12 meses. O valor será salvo no campo `deadline` (reutilizando a coluna existente) como string `"6"` ou `"12"`, ou alternativamente no `platform_attributes` como `tempo_contrato`.

**Decisão técnica**: Salvar em `platform_attributes` (JSONB) com chave `tempo_contrato` é mais limpo, pois o campo `deadline` é do tipo `date` e guardar "6"/"12" causaria erro de tipo. Usar `platform_attributes` mantém consistência com os demais atributos operacionais.

Alteração concreta:
- Remover o campo `<input type="date">` de Prazo (linhas 131-139)
- Adicionar um `<select>` com label "Tempo de Contrato" e opções: `—`, `6 meses`, `12 meses`
- Salvar via `updatePlatform.mutate({ id: cp.id, updates: { platformAttributes: { ...cp.platformAttributes, tempo_contrato: value } } })`

**Arquivo: `src/pages/ProjectsPage.tsx`**

Atualizar os cards de plataforma na página de Squads:
- Substituir a linha "Prazo" por "Tempo de Contrato" mostrando o valor salvo (ex: "6 meses", "12 meses" ou "—")

Nenhuma mudança de banco de dados necessária.

