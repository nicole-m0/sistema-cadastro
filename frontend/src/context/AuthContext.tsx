import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Admin } from '../types';
import * as authService from '../services/auth';
import { ApiRequestError } from '../lib/api';

interface AuthContextValue {
  admin: Admin | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authService
      .fetchCurrentAdmin()
      .then((res) => {
        if (active) setAdmin(res.data);
      })
      .catch(() => {
        if (active) setAdmin(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setAdmin(res.data);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAdmin(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ admin, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }
  return ctx;
}

export function isApiError(err: unknown): err is ApiRequestError {
  return err instanceof ApiRequestError;
}
