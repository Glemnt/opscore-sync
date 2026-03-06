

## Plano: "Nova Plataforma" cria apenas registro em `client_platforms` (sem criar cliente)

### Problema
Atualmente o dialog cria um **novo cliente** + plataforma. O usuario quer criar **apenas** um registro em `client_platforms`, vinculando a um cliente ja existente.

### Alteracao: `src/components/AddPlatformSquadDialog.tsx`

Reescrever o formulario para:

1. **Substituir campos de cliente** (nome, empresa, CNPJ, nicho, telefone, email, faturamento, tempo de contrato, origem) por um **dropdown de selecao de cliente existente**
2. **Manter apenas os campos da plataforma:**
   - Cliente (dropdown dos clientes existentes)
   - Plataforma (selecao unica)
   - Tipo de Cliente (Seller/Lojista) → `quality_level`
   - Responsavel pelo Onboarding → `responsible`
   - Time Responsavel (pre-selecionado) → `squad_id`
   - Saude da Plataforma → `health_color`

3. **Submit**: chamar apenas `useAddClientPlatform` com o `clientId` selecionado — sem chamar `addClient()`

### Remover
- Imports de `useClients`, `useAuth`, `Client`, `Platform`
- Todos os states de campos de cliente (name, companyName, cnpj, segment, phone, email, revenueTier, contractDuration, origin)
- Constantes `ORIGIN_OPTIONS`, `REVENUE_OPTIONS`

