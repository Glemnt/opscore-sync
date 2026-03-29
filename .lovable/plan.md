

## Expansao do Cadastro de Clientes — 30+ Novos Campos

### Resumo

Adicionar todos os campos da planilha operacional do Grupo TG ao sistema, organizados em secoes. Envolve migration de banco, tipos, mapper, formulario de cadastro, modal de detalhe e card de listagem.

---

### 1. Migration — Novas colunas na tabela `clients`

Adicionar via migration as seguintes colunas (todas com defaults seguros para nao quebrar registros existentes):

**Dados cadastrais:**
- `razao_social text DEFAULT ''`
- `perfil_cliente text DEFAULT 'brasileiro'` (brasileiro/boliviano/outro)
- `endereco text DEFAULT ''`
- `cidade text DEFAULT ''`
- `estado text DEFAULT ''`
- `logistica_principal text DEFAULT ''`
- `nome_proprietario text DEFAULT ''`
- `cpf_responsavel text DEFAULT ''`

**Equipe interna:**
- `cs_responsavel text DEFAULT ''`
- `manager text DEFAULT ''`
- `auxiliar text DEFAULT ''`
- `assistente text DEFAULT ''`
- `consultor_atual text DEFAULT ''`

**Contratuais:**
- `vendedor text DEFAULT ''`
- `status_financeiro text DEFAULT 'em_dia'`
- `multa_rescisoria numeric DEFAULT NULL`
- `data_fim_prevista date DEFAULT NULL`

**Operacionais:**
- `fase_macro text DEFAULT 'implementacao'`
- `sub_status text DEFAULT NULL`
- `ultimo_contato date DEFAULT NULL`
- `ultima_resposta_cliente date DEFAULT NULL`
- `motivo_atraso_geral text DEFAULT ''`
- `risco_churn text DEFAULT 'baixo'`
- `tipo_cliente text DEFAULT 'seller'`
- `data_prevista_passagem date DEFAULT NULL`
- `data_real_passagem date DEFAULT NULL`
- `prioridade_geral text DEFAULT 'P2'`
- `nps_ultimo numeric DEFAULT NULL`

Total: 27 novas colunas. Campos `cnpj`, `phone`, `email`, `setup_fee` ja existem.

---

### 2. Tipos — `src/types/index.ts`

Expandir a interface `Client` com todos os novos campos camelCase. Adicionar tipos auxiliares: `FaseMacro`, `SubStatus`, `PerfilCliente`, `StatusFinanceiro`, `RiscoChurn`, `TipoCliente`, `PrioridadeGeral`.

---

### 3. Mapper — `src/types/database.ts`

Atualizar `mapDbClient` para mapear todas as novas colunas snake_case -> camelCase.

---

### 4. Query hooks — `src/hooks/useClientsQuery.ts`

Atualizar `useAddClient` e `useUpdateClient` com os novos mapeamentos no `keyMap`.

---

### 5. AddClientDialog — Formulario com Accordion

Reorganizar o formulario em secoes com `Accordion`:

- **Identificacao**: nome, empresa, razaoSocial, perfilCliente, segment
- **Dados da Empresa**: cnpj, cpfResponsavel, nomeProprietario, endereco, cidade, estado, logisticaPrincipal
- **Contato**: phone, email
- **Equipe Interna**: responsavel, csResponsavel, manager, auxiliar, assistente, consultorAtual (selects de appUsers)
- **Financeiro** (admin only): monthlyRevenue, setupFee, contractType, paymentDay, contractDuration, vendedor, statusFinanceiro, multaRescisoria, dataFimPrevista
- **Prazos e Status**: faseMacro, subStatus (condicional se faseMacro=implementacao), riscoChurn, tipoCliente, prioridadeGeral, npsUltimo
- **Plataformas**: selecao de plataformas (existente)

O dialog fica mais largo (`sm:max-w-2xl`) para acomodar os campos. Accordion permite collapsar secoes.

---

### 6. ClientDetailModal — Edicao dos novos campos

Adicionar os novos campos nas secoes correspondentes do modal, todos editaveis no modo de edicao (isEditing). Campos financeiros protegidos por `isAdmin`.

---

### 7. ClientsPage Card — Novos indicadores

Atualizar o card para exibir:
- `faseMacro` como badge principal (substituindo status)
- `subStatus` como sub-badge quando presente
- `prioridadeGeral` como indicador
- `riscoChurn` com cor contextual
- Metricas computadas: quantidade de plataformas, plataformas em atraso (calculadas de `clientPlatforms`)

---

### 8. Changelog

O sistema de changelog (`updateClient` no `ClientsContext`) ja registra automaticamente qualquer campo alterado. Nenhuma mudanca adicional necessaria.

---

### Ordem de implementacao

1. Migration (banco)
2. Types + Mapper + Query hooks
3. AddClientDialog (accordion)
4. ClientDetailModal (novos campos)
5. ClientsPage card (visual)

### Arquivos modificados

- `supabase/migrations/` — nova migration
- `src/types/index.ts`
- `src/types/database.ts`
- `src/hooks/useClientsQuery.ts`
- `src/components/AddClientDialog.tsx`
- `src/components/ClientDetailModal.tsx`
- `src/pages/ClientsPage.tsx`

