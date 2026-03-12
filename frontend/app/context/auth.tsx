'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, createContext, useContext } from 'react';
import api from '@/app/lib/api';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  permissions: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleToken = (currentToken: string) => {
    try {
      const decoded = JSON.parse(atob(currentToken.split('.')[1]));
      setUser(decoded);
      setPermissions(decoded.permissions || []);
      setToken(currentToken);
    } catch (e) {
      localStorage.removeItem('accessToken');
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      handleToken(storedToken);
    }
    setLoading(false);

    // Listen for axios interceptor token refresh
    const handleTokenRefresh = (e: any) => {
      handleToken(e.detail);
    };

    window.addEventListener('tokenRefreshed', handleTokenRefresh as EventListener);
    
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh as EventListener);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data && response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      setToken(response.data.accessToken);
      setUser(response.data.user);
      setPermissions(response.data.user.permissions || []);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Silent fail
    }
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    setPermissions([]);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, permissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
