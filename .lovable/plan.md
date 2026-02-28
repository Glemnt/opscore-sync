

## Indicação visual de Squad e Nível de Acesso na Sidebar

### Mudança

**`src/components/AppSidebar.tsx`** — No bloco do footer (seção do usuário logado), adicionar:
- Nome do squad do usuário (buscado da lista de squads via `useSquadsQuery`)
- Badge com o nível de acesso (1 = Operacional, 2 = Tático, 3 = Admin)

Layout no footer:
```text
┌──────────────────────────┐
│ [Avatar] Nome do Usuário │
│          Cargo           │
│  🏷 Squad Alpha · Admin │
└──────────────────────────┘
```

### Detalhes técnicos
- Importar `useSquadsQuery` para buscar nomes dos squads
- Mapear `currentUser.squadIds` para nomes de squads
- Mostrar badge colorido para nível de acesso:
  - Nível 1: cinza ("Operacional")
  - Nível 2: azul ("Tático")  
  - Nível 3: roxo ("Admin")
- Se o usuário pertence a múltiplos squads, listar separados por vírgula

