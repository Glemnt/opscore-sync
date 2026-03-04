

## Plano: Inserir templates de demandas padrão para cada status da pipeline

### O que será feito

Inserir registros na tabela `phase_demand_templates` com demandas padrão para cada um dos 4 status da pipeline existentes: **Backlog**, **Em Andamento**, **Concluído** e **Aguard. Cliente**.

### Templates a serem inseridos

| Fase | Demanda | Tipo |
|---|---|---|
| **backlog** | Briefing inicial com o cliente | Cliente |
| **backlog** | Definir escopo e objetivos | Interna |
| **backlog** | Levantamento de acessos necessários | Interna |
| **in_progress** | Configuração da plataforma | Interna |
| **in_progress** | Criação de campanhas iniciais | Interna |
| **in_progress** | Revisão e aprovação do cliente | Cliente |
| **waiting_client** | Envio de materiais pendentes | Cliente |
| **waiting_client** | Aprovação de criativos | Cliente |
| **waiting_client** | Validação de acessos | Cliente |
| **done** | Relatório de entrega | Interna |
| **done** | Reunião de encerramento | Cliente |

### Execução

Uma única migração SQL com `INSERT INTO phase_demand_templates` contendo os 11 registros acima, com `sort_order` sequencial dentro de cada fase. Os 2 registros de teste existentes serão mantidos.

### Arquivos afetados

Nenhum arquivo de código alterado -- apenas uma migração de banco de dados.

