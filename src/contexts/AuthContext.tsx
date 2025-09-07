import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  canAddStudents: (targetStudentId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const USERINFO_TTL_MS = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    // Initialize from stored token and cached user
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) { setIsLoading(false); return; }
    const cached = localStorage.getItem('auth_user');
    const cachedAtStr = localStorage.getItem('auth_user_cached_at');
    const cachedAt = cachedAtStr ? Number(cachedAtStr) : 0;
    const fresh = cached && cachedAt && Date.now() - cachedAt < USERINFO_TTL_MS;
    if (cached && fresh) {
      try { setUser(JSON.parse(cached)); } catch {}
      setIsLoading(false);
      return;
    }
    // No cache or stale — fetch once
    validateToken(token);
  }, []);

  const mapUserInfoToUser = (info: any): User => {
    const roles: string[] =
      info?.resource_access?.['xenon-client']?.roles ||
      info?.resource_access?.['xenonclient']?.roles ||
      info?.realm_access?.roles || [];
    const has = (r: string) => roles.map(String).map((x) => x.toUpperCase()).includes(r.toUpperCase());
    let role: User['role'] = 'self-learner';
    if (has('ADMIN')) role = 'admin';
    else if (has('TENANT_MANAGER')) role = 'tenant-manager';
    else if (has('TEACHER')) role = 'teacher';
    else if (has('STUDENT')) role = 'student';
    else if (has('SELF_LEARNER')) role = 'self-learner';

    const name = info?.name || [info?.given_name, info?.family_name].filter(Boolean).join(' ') || (info?.email ?? '');
    const email = info?.email || info?.preferred_username || '';

    return {
      id: String(info?.sub || info?.id || ''),
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
    };
  };

  const refreshUserInfo = async (token: string) => {
    const info = await apiService.fetchUserInfo(token);
    localStorage.setItem('auth_userinfo', JSON.stringify(info));
    const mapped = mapUserInfoToUser(info);
    localStorage.setItem('auth_user', JSON.stringify(mapped));
    localStorage.setItem('auth_user_cached_at', String(Date.now()));
    setUser(mapped);
  };

  const validateToken = async (token: string) => {
    try {
      await refreshUserInfo(token);
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_userinfo');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const tokens = await apiService.login({ email, password });
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      await refreshUserInfo(tokens.access_token);
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.registerSelfLearner({
        firstName,
        lastName,
        email,
        password,
        confirmPassword: password,
      });
      // Registration does not issue tokens; keep user logged out.
      // Optionally store a flag for UI.
      console.debug('Register result:', res);
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_userinfo');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
    canAddStudents: (targetStudentId: string) => {
      if (!user) return false;
      if (user.role === 'self-learner') {
        return user.id === targetStudentId; // only themselves
      }
      return true;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
