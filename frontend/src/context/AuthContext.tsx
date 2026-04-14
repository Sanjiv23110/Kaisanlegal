import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, getAuthToken } from '../lib/api';

export interface User {
  name?: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  /** Re-fetch /api/me and update the in-memory user (e.g. after profile update). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.getMe();
      setUser({ name: userData.name, email: userData.email });
    } catch {
      // token expired or network error — leave user as-is
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await api.getMe();
          setUser({ name: userData.name, email: userData.email });
        } catch (error) {
          api.logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    // token is already stored in api.ts during api.login
    setUser(userData);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
