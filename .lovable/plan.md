

## Fix: Percentuais absurdos na pagina Capacidade

### Problema
`activeStatuses` inclui `'backlog'`, inflando a carga com 100+ tarefas por pessoa. maxCapacity=8 gera 1000%+.

### Correcao em `src/pages/CapacityPage.tsx`

**1. Separar statuses ativos de backlog**

```
activeStatuses = ['in_progress', 'waiting_client', 'em_andamento', 'aguardando_cliente', 'revisao', 'aguardando_aprovacao', 'bloqueada']
backlogStatuses = ['backlog']
```

**2. Reformular userLoad memo**

- `current`: conta apenas tarefas em `activeStatuses` (em execucao)
- `backlog`: conta tarefas em `backlogStatuses` (informativo)
- `projected7/15/30`: conta tarefas em backlog com deadline dentro do periodo (carga futura que vai cair na fila)

**3. Adicionar coluna "Backlog" na tabela**

Nova coluna entre "Carga Atual" e "Max" mostrando quantidade de backlog por pessoa (texto muted, sem impacto no %).

**4. Projecoes mostram backlog que vira carga**

As colunas 7d/15d/30d passam a mostrar: `carga_atual + backlog_com_deadline_no_periodo`. Isso indica "se nada mudar, em 7 dias esta pessoa tera X tarefas ativas".

**5. Legenda explicativa**

Adicionar texto abaixo da tabela: "Carga = tarefas em andamento, aguardando cliente, revisao, aprovacao ou bloqueada. Backlog nao conta como carga ativa."

### Arquivo
- `src/pages/CapacityPage.tsx`

