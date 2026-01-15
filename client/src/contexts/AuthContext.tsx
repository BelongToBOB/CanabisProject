import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../services/api';

export type Role = 'ADMIN' | 'STAFF';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        console.log('[Auth] Initializing auth state from localStorage');
        
        // Clean up any legacy 'token' key (we only use 'authToken')
        if (localStorage.getItem('token')) {
          console.warn('[Auth] Found legacy "token" key - removing it (we use "authToken" only)');
          localStorage.removeItem('token');
        }

        // Try authToken first, fallback to legacy token for backward compatibility
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('[Auth] Restored user from localStorage:', parsedUser.username, 'role:', parsedUser.role);
          setUser(parsedUser);
          
          // If we found token in legacy key, migrate it
          if (!localStorage.getItem('authToken') && localStorage.getItem('token')) {
            console.log('[Auth] Migrating token from legacy "token" key to "authToken"');
            localStorage.setItem('authToken', token);
            localStorage.removeItem('token');
          }
        } else {
          console.log('[Auth] No valid auth state found in localStorage');
        }
      } catch (error) {
        console.error('[Auth] Failed to initialize auth state:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // Clean up legacy key
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      console.log('[Auth] Attempting login for:', credentials.username);
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      const { token, user: userData } = response.data;

      console.log('[Auth] Login successful, storing token for user:', userData.username, 'role:', userData.role);

      // Clean up any legacy keys first
      localStorage.removeItem('token');

      // Store ONLY authToken (standardized key)
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('[Auth] Token stored in authToken key');

      setUser(userData);
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      
      // Clear any existing auth state on login failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('token'); // Clean up legacy key
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    console.log('[Auth] Logging out user');
    
    // Clear all auth state
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Clean up legacy key
    setUser(null);

    // Note: We don't call /auth/logout endpoint because:
    // 1. JWT is stateless (no server-side session)
    // 2. We may not have a valid token at this point
    // 3. Clearing localStorage is sufficient
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
