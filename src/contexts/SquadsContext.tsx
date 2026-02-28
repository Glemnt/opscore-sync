import { createContext, useContext, ReactNode, useCallback } from 'react';
import { Squad } from '@/types';
import { useSquadsQuery, useAddSquad, useUpdateSquad, useRemoveSquad } from '@/hooks/useSquadsQuery';

interface SquadsContextType {
  squads: Squad[];
  isLoading: boolean;
  addSquad: (squad: Squad) => void;
  removeSquad: (id: string) => void;
  updateSquad: (id: string, updates: Partial<Omit<Squad, 'id'>>) => void;
}

const SquadsContext = createContext<SquadsContextType | undefined>(undefined);

export function SquadsProvider({ children }: { children: ReactNode }) {
  const { data: squads = [], isLoading } = useSquadsQuery();
  const addSquadMut = useAddSquad();
  const updateSquadMut = useUpdateSquad();
  const removeSquadMut = useRemoveSquad();

  const addSquad = useCallback((squad: Squad) => addSquadMut.mutate(squad), [addSquadMut]);
  const removeSquad = useCallback((id: string) => removeSquadMut.mutate(id), [removeSquadMut]);
  const updateSquad = useCallback((id: string, updates: Partial<Omit<Squad, 'id'>>) => updateSquadMut.mutate({ id, updates }), [updateSquadMut]);

  return (
    <SquadsContext.Provider value={{ squads, isLoading, addSquad, removeSquad, updateSquad }}>
      {children}
    </SquadsContext.Provider>
  );
}

export function useSquads() {
  const context = useContext(SquadsContext);
  if (!context) throw new Error('useSquads must be used within SquadsProvider');
  return context;
}
