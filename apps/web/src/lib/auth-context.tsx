'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStore } from './api';
import type { AuthResult, User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Auth endpointlari natijasini qabul qiladi va sessiyani o'rnatadi */
  signIn: (result: AuthResult) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    if (!tokenStore.access && !tokenStore.refresh) {
      setUserState(null);
      setLoading(false);
      return;
    }
    try {
      setUserState(await api<User>('/auth/me'));
    } catch {
      tokenStore.clear();
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const signIn = useCallback((result: AuthResult) => {
    tokenStore.save(result.tokens);
    setUserState(result.user);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = tokenStore.refresh;
    if (refreshToken) {
      await api('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
        raw: true,
      }).catch(() => undefined);
    }
    tokenStore.clear();
    setUserState(null);
    router.push('/');
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      refreshUser: loadUser,
      setUser: setUserState,
    }),
    [user, loading, signIn, signOut, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return context;
}
