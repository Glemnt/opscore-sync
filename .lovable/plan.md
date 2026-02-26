

## Plan: Add "Fluxo" (Workflow) Dropdown Button Next to "Nova Demanda"

### Approach
Add a dropdown menu button next to the existing "Nova Demanda" button with three options: **Criar Fluxo**, **Editar Fluxo**, and **Atribuir Fluxo ao Cliente**. Each option opens a dedicated dialog.

### Data Model
- Add a `Flow` type to `src/types/index.ts` with fields: `id`, `name`, `steps` (array of step labels), `createdAt`.
- Add a `clientFlows` mapping (clientId -> flowId[]) to track assignments.
- Extend `TasksContext` to store flows and client-flow assignments with CRUD operations.

### New Components
1. **`src/components/FlowManagerDialog.tsx`** — A single dialog component with tabs/modes for:
   - **Criar Fluxo**: Form with flow name + dynamic list of steps (add/remove/reorder).
   - **Editar Fluxo**: Select an existing flow, then edit its name/steps. Option to delete.
   - **Atribuir Fluxo**: Select a client, select a flow, assign it (creates tasks from flow steps).

### Changes to Existing Files
1. **`src/types/index.ts`**: Add `Flow` interface.
2. **`src/contexts/TasksContext.tsx`**: Add `flows` state, `clientFlows` state, and methods: `addFlow`, `updateFlow`, `deleteFlow`, `assignFlowToClient`.
3. **`src/pages/TasksPage.tsx`**:
   - Import `DropdownMenu` from radix and the new dialog.
   - In the `PageHeader` actions, add a dropdown button ("Fluxos") with three menu items.
   - Each item sets a dialog mode and opens `FlowManagerDialog`.

### UI Details
- The dropdown button uses `outline` variant styling to differentiate from the primary "Nova Demanda" button.
- Uses `Workflow` icon from lucide-react.
- Dialog uses tabs or conditional rendering based on which action was selected.

