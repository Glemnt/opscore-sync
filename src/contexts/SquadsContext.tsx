import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Squad } from '@/types';
import { squads as initialSquads } from '@/data/mockData';

interface SquadsContextType {
  squads: Squad[];
  addSquad: (squad: Squad) => void;
  removeSquad: (id: string) => void;
  updateSquad: (id: string, updates: Partial<Omit<Squad, 'id'>>) => void;
}

const SquadsContext = createContext<SquadsContextType | undefined>(undefined);

export function SquadsProvider({ children }: { children: ReactNode }) {
  const [squads, setSquads] = useState<Squad[]>(initialSquads);

  const addSquad = useCallback((squad: Squad) => {
    setSquads((prev) => [...prev, squad]);
  }, []);

  const removeSquad = useCallback((id: string) => {
    setSquads((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSquad = useCallback((id: string, updates: Partial<Omit<Squad, 'id'>>) => {
    setSquads((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  return (
    <SquadsContext.Provider value={{ squads, addSquad, removeSquad, updateSquad }}>
      {children}
    </SquadsContext.Provider>
  );
}

export function useSquads() {
  const context = useContext(SquadsContext);
  if (!context) throw new Error('useSquads must be used within SquadsProvider');
  return context;
}
