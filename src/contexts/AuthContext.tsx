import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types';
import type { AppUserProfile } from '@/types/database';
import { mapDbAppUser } from '@/types/database';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: AppUserProfile | null;
  session: Session | null;
  loading: boolean;
  users: AppUserProfile[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  addUser: (user: AppUserProfile) => void;
  getVisibleClients: (clients: Client[]) => Client[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUserProfile | null>(null);
  const [users, setUsers] = useState<AppUserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();
    if (data && !error) {
      setCurrentUser(mapDbAppUser(data));
    } else {
      // No app_user profile yet — create a minimal one
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase auth
        setTimeout(() => fetchAppUser(sess.user.id), 0);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // THEN check current session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        fetchAppUser(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchAppUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    // Create app_users entry
    if (data.user) {
      await supabase.from('app_users').insert({
        auth_user_id: data.user.id,
        name,
        login: email,
        role: 'operacional',
        access_level: 1,
        squad_ids: [],
      });
      // Give user role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'user',
      });
    }
    return {};
  }, []);

  const addUser = useCallback((user: AppUserProfile) => {
    setUsers((prev) => [...prev, user]);
  }, []);

  const getVisibleClients = useCallback((clients: Client[]): Client[] => {
    if (!currentUser) return [];
    if (currentUser.accessLevel === 3) return clients;
    return clients.filter((c) => currentUser.squadIds.includes(c.squadId));
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, session, loading, users, login, logout, signup, addUser, getVisibleClients }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
