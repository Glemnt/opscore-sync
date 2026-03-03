

## Plano: Atributos Operacionais Específicos por Plataforma

### Problema
Cada plataforma (Mercado Livre, Shopee, Shein) possui atributos operacionais únicos que precisam ser gerenciados por cliente. Atualmente, a tabela `client_platforms` só armazena dados genéricos (fase, responsável, squad).

### Solução

Usar uma coluna JSONB `platform_attributes` na tabela `client_platforms` para armazenar os atributos específicos de cada plataforma. Isso evita criar tabelas separadas para cada marketplace e permite adicionar novos atributos futuramente sem migrações.

### Estrutura dos atributos por plataforma

```text
mercado_livre:
  reputacao: "verde" | "vermelho" | "laranja" | "amarelo"
  medalha: "sem_medalha" | "lider" | "gold" | "platinum" | "loja_oficial"
  envios: "full" | "flex" | "turbo"

shopee:
  vendedor_indicado: true | false
  shopee_express: true | false
  shopee_entrega_direta: true | false
  full_shopee: true | false

shein:
  reputacao: "L1" | "L2" | "L3" | "L4" | "L5"
```

### Tarefas de Implementação

1. **Migração de banco**: Adicionar coluna `platform_attributes jsonb DEFAULT '{}'` à tabela `client_platforms`

2. **Atualizar hook `useClientPlatformsQuery`**: Incluir `platformAttributes` no mapeamento da interface `ClientPlatform` e no `keyMap` do update

3. **Criar componente `PlatformAttributesEditor`**: Renderiza os campos específicos de cada plataforma baseado no slug:
   - `mercado_livre`: 3 selects (Reputação com cores, Medalha, Envios)
   - `shopee`: 4 switches/checkboxes (Vendedor Indicado, Shopee Express, Entrega Direta, Full Shopee)
   - `shein`: 1 select (Reputação L1-L5)

4. **Integrar no `PlatformOperationalPanel`** (ClientDetailModal): Renderizar o `PlatformAttributesEditor` dentro de cada plataforma expandida, abaixo dos campos existentes (fase, squad, responsável, prazo)

5. **Exibir resumo no `ClientCard`** (ClientsPage): Mostrar badges compactos com os atributos principais (ex: 🟢 Gold · Full para Mercado Livre)

### Detalhes Técnicos

- A definição de quais atributos cada plataforma possui ficará em um mapa constante no código (`PLATFORM_ATTRIBUTE_DEFINITIONS`), facilitando adicionar novas plataformas ou atributos sem mudar o banco
- O componente de edição será dinâmico, renderizando selects ou switches conforme o tipo de cada atributo
- A coluna JSONB permite queries futuras (ex: filtrar clientes com reputação vermelha no ML)

