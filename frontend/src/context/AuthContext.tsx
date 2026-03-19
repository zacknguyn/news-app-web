import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { tokenStorage, setGlobalLogout } from '../services/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  avatar?: string;
  favoriteTopics?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    // Set the global logout function reference
    setGlobalLogout(() => {
      clearAuthData();
    });
    
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = tokenStorage.getToken();
      const storedUserData = localStorage.getItem('userData');

      if (storedToken && storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        // Validate token (simple expiration check)
        if (isTokenValid(storedToken)) {
          setToken(storedToken);
          setUserState(userData);
          setIsAuthenticated(true);
        } else {
          // Token expired, clear storage
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiration;
    } catch (error) {
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { token: authToken, user: userData } = data.data;
        
        // Store auth data
        tokenStorage.setToken(authToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Update state
        setToken(authToken);
        setUserState(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { token: authToken, user: newUser } = data.data;
        
        // Store auth data
        tokenStorage.setToken(authToken);
        localStorage.setItem('userData', JSON.stringify(newUser));
        
        // Update state
        setToken(authToken);
        setUserState(newUser);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const clearAuthData = () => {
    tokenStorage.removeToken();
    localStorage.removeItem('userData');
    setToken(null);
    setUserState(null);
    setIsAuthenticated(false);
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
    localStorage.setItem('userData', JSON.stringify(newUser));
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};