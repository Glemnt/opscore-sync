

## Plano: Adicionar status "Ativo" e "Inativo" na tabela client_statuses para o board "clients"

### Problema

A tabela `client_statuses` com `board = 'clients'` contém apenas 3 registros: Onboarding (sort_order 2), Implementação (3) e Performance (4). Os status "Ativo" e "Inativo" não foram inseridos, por isso não aparecem como opções de filtro na página de Clientes.

### Solução

Inserir os registros faltantes na tabela `client_statuses`:

| key | label | class_name | board | sort_order |
|-----|-------|------------|-------|------------|
| active | Ativo | bg-success-light text-success border-success/20 | clients | 0 |
| escala | Escala | bg-purple-100 text-purple-700 border-purple-200 | clients | 5 |
| inativo | Inativo | bg-destructive/10 text-destructive border-destructive/20 | clients | 6 |

Isso restaura a pipeline completa: Ativo → Onboarding → Implementação → Performance → Escala → Inativo.

Nenhuma alteração de código necessária — a página já lê dinamicamente da tabela.

