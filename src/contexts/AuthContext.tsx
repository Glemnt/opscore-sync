import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AppUser, AccessLevel, Client } from '@/types';
import { clients, squads } from '@/data/mockData';

interface AuthContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  login: (login: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: AppUser) => void;
  getVisibleClients: () => Client[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdmin: AppUser = {
  id: 'u_admin',
  name: 'Beatriz Costa',
  login: 'admin',
  password: 'admin123',
  role: 'gestao',
  accessLevel: 3,
  squadIds: squads.map((s) => s.id),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([defaultAdmin]);

  const login = useCallback(
    (loginStr: string, password: string): boolean => {
      const found = users.find((u) => u.login === loginStr && u.password === password);
      if (found) {
        setCurrentUser(found);
        return true;
      }
      return false;
    },
    [users]
  );

  const logout = useCallback(() => setCurrentUser(null), []);

  const addUser = useCallback((user: AppUser) => {
    setUsers((prev) => [...prev, user]);
  }, []);

  const getVisibleClients = useCallback((): Client[] => {
    if (!currentUser) return [];
    if (currentUser.accessLevel === 3) return clients;
    // Level 1 & 2: filter by user's squadIds
    return clients.filter((c) => currentUser.squadIds.includes(c.squadId));
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, getVisibleClients }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
