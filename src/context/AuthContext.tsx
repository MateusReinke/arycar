import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AuthUser, UserRole } from '@/types';

const STORAGE_KEY = 'arycar_auth_user';

interface AuthContextType {
  user: AuthUser | null;
  login: (payload: AuthUser) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const login = (payload: AuthUser) => {
    setUser(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const value = useMemo(() => ({ user, login, logout, hasRole }), [user, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
