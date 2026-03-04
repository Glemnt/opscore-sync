

## Plano: Redesign visual do card de plataforma no Kanban

### Problema atual
O card mistura informacoes em listas simples "label: valor" sem hierarquia visual. Tudo parece igual, dificultando a leitura rapida.

### Novo design

Reorganizar o card em secoes visuais distintas:

**Header** (linha 869-874): Manter icone + nome da plataforma. Adicionar badges de Quality Level e Health ao lado direito do header em vez de uma linha separada — economiza espaco vertical e cria um header rico.

**Secao de contexto** (linhas 896-909): Substituir a lista "label: valor" por um layout com icones pequenos em vez de labels textuais. Usar `Users` icon para Squad, `UserCircle` para Responsavel, `Calendar` para Contrato. Cada item em uma unica linha com icone + valor, sem label textual longo.

**Atributos operacionais** (linhas 911-919): Transformar a lista de atributos em badges compactos coloridos em vez de linhas "label: valor". Por exemplo: "🟢 Verde", "Gold", "Full" como badges inline em uma unica linha com wrap.

**Footer** (linhas 922-935): Manter contagem de projetos/demandas + botao de transferir. Adicionar um mini progress bar baseado no numero de demandas concluidas vs total, se houver dados.

### Mudancas tecnicas em `src/pages/ProjectsPage.tsx`

1. **Header com badges inline**: Mover quality level e health para dentro do header, como badges ao lado do nome.

2. **Contexto com icones**: Trocar labels textuais por icones Lucide (`Users`, `UserCircle`, `CalendarDays`), com texto menor e mais compacto. Layout em grid 2 colunas para Squad/Responsavel, contrato abaixo.

3. **Atributos como badges**: Renderizar atributos operacionais (reputacao, medalha, envios, etc.) como badges coloridos em uma linha flex-wrap, com cores contextuais (verde para positivo, neutro para default).

4. **Footer aprimorado**: Adicionar indicador visual de proporcao projetos/demandas.

