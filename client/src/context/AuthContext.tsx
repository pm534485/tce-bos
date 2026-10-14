import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@syllabusforge/shared';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (data: { email?: string; name?: string; credential?: string; avatar?: string; googleId?: string }) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('syllabusforge_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (_) {
          localStorage.removeItem('syllabusforge_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('syllabusforge_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const googleLogin = async (data: { email?: string; name?: string; credential?: string; avatar?: string; googleId?: string }) => {
    const res = await api.googleLogin(data);
    localStorage.setItem('syllabusforge_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const quickLogin = async (role: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@tce.edu', pass: 'AdminPassword2026!' },
      HOD: { email: 'hod.ca@tce.edu', pass: 'HodPassword2026!' },
      FACULTY: { email: 'psaca@tce.edu', pass: 'FacultyPassword2026!' },
    };
    const c = creds[role];
    await login(c.email, c.pass);
  };

  const logout = () => {
    localStorage.removeItem('syllabusforge_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        googleLogin,
        quickLogin,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
