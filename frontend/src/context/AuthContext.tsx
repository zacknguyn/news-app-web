/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { backendApi, clearAuthSession, getAuthToken, getStoredUser, setAuthSession } from '../lib/api';
import { backendUserToUser } from '../lib/backendAdapters';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    reportingFocus?: string;
    recaptchaToken?: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const storedUser = getStoredUser<User>();

    if (storedUser) {
      setUser(storedUser);
    }

    const refreshCurrentUser = async () => {
      const token = getAuthToken();
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await backendApi.getCurrentUser();
        const appUser = backendUserToUser(currentUser);
        if (!isMounted) return;
        setUser(appUser);
        setAuthSession(token, appUser);
      } catch {
        if (!isMounted) return;
        setUser(null);
        clearAuthSession();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    refreshCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const session = await backendApi.login(email, password);
      const appUser = backendUserToUser(session.user);
      setUser(appUser);
      setAuthSession(session.token, appUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: {
    name: string;
    email: string;
    password: string;
    reportingFocus?: string;
    recaptchaToken?: string;
  }) => {
    setIsLoading(true);
    try {
      await backendApi.register(input);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthSession();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
