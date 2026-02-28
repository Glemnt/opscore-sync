

## Plan: Add Delete and Edit Client Functionality

### Files to Change

#### 1. `src/contexts/ClientsContext.tsx`
- Add `deleteClient(clientId: string)` method — filters out client by ID
- Add `updateClient(clientId: string, updates: Partial<Client>)` method — merges updates into existing client with change log entries
- Expose both in context type and provider value

#### 2. `src/components/ClientDetailModal.tsx`
- Add a **delete button** (red, with Trash2 icon) in the modal header area
- Show an `AlertDialog` confirmation before deleting ("Tem certeza que deseja apagar este cliente?")
- On confirm: call `deleteClient`, close modal
- Add an **"Editar" button** that toggles a full edit mode where main fields (name, companyName, segment, status, platforms, contractType, paymentDay, contractDuration, notes) become editable inputs
- Add "Salvar" / "Cancelar" buttons in edit mode that call `updateClient` with all changed fields

#### 3. `src/pages/ClientsPage.tsx`
- No structural changes needed — already uses `getVisibleClients()` which reads from context state, so deletions and edits will reflect automatically

