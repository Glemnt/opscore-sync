

## Fix: Corrigir acentuação nos Tipos de Demanda

### Problema
Labels na tabela `task_types` com acentuação incorreta (ex: "Ativaçao" → "Ativação").

### Correção
Executar 5 UPDATEs na tabela `task_types` via insert tool (é alteração de dados, não de schema):

```sql
UPDATE task_types SET label = 'Ativação de Clips' WHERE label LIKE '%Ativaçao de Clps%';
UPDATE task_types SET label = 'Ativação de Termômetro' WHERE label LIKE '%Ativaçao de Termometro%';
UPDATE task_types SET label = 'Criação de Anúncio' WHERE label LIKE '%Criaçao de Anuncio%';
UPDATE task_types SET label = 'Decoração da Loja' WHERE label LIKE '%Decoraçao da Loja%';
UPDATE task_types SET label = 'Otimização do Ads' WHERE label LIKE '%Otimizaçao do Ads%';
```

### Nenhum arquivo de código alterado
Os labels vêm direto do banco via `useTaskTypesQuery`. Corrigir no banco resolve em todos os lugares.

