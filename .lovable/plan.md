

## Plano: Sincronizar plataformas dos clientes com a tabela client_platforms

### Problema

52 dos 95 clientes que possuem plataformas configuradas no campo `clients.platforms` nao possuem registros correspondentes na tabela `client_platforms`. Isso faz com que a aba de plataformas na pagina Squads apareca vazia para esses clientes.

A causa raiz e que esses clientes foram criados antes da funcionalidade de sincronizacao automatica ser implementada, ou a sincronizacao falhou.

### Solucao

**1. Migracao SQL para criar registros faltantes (~1 query)**

Inserir registros em `client_platforms` para cada combinacao cliente/plataforma que existe em `clients.platforms` mas nao tem registro correspondente em `client_platforms`:

```sql
INSERT INTO public.client_platforms (client_id, platform_slug, phase, responsible, squad_id)
SELECT c.id, unnest(c.platforms)::text, 'onboarding', c.responsible, c.squad_id
FROM clients c
WHERE c.platforms IS NOT NULL AND array_length(c.platforms, 1) > 0
AND NOT EXISTS (
  SELECT 1 FROM client_platforms cp 
  WHERE cp.client_id = c.id
)
ON CONFLICT DO NOTHING;
```

Isso cria os registros com:
- `phase` = 'onboarding' (padrao)
- `responsible` = mesmo responsavel do cliente
- `squad_id` = mesmo squad do cliente

**2. Proteção futura (opcional, recomendado)**

Verificar no codigo de criacao de clientes (`AddClientDialog.tsx` ou `ClientsContext.tsx`) se a sincronizacao ja esta implementada corretamente para novos clientes, evitando reincidencia.

### Impacto
- 1 migracao SQL
- 0 arquivos de codigo alterados (a menos que a sincronizacao precise de ajuste)
- ~130 novos registros em `client_platforms` (52 clientes x ~2.5 plataformas em media)

