import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
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

  useEffect(() => {
    // Check for existing token on app start
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token and set user
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      // TODO: Implement token validation with backend
      // For now, we'll mock the user
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date().toISOString()
      };
      setUser(mockUser);
    } catch (error) {
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login with backend
      // Mock login for now
      let role: User['role'] = 'self-learner';
      let tenantId: string | undefined = undefined;
      if (email.startsWith('admin')) role = 'admin';
      else if (email.includes('manager')) { role = 'tenant-manager'; tenantId = 't-1'; }
      else if (email.includes('teacher')) { role = 'teacher'; tenantId = 't-1'; }
      else if (email.includes('student')) { role = 'student'; tenantId = 't-1'; }

      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role,
        tenantId,
        createdAt: new Date().toISOString(),
        plan: role === 'self-learner' ? 'free' : 'team',
      };

      const mockToken = 'mock-jwt-token';
      localStorage.setItem('authToken', mockToken);
      setUser(mockUser);
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock register: create a user and auth token
      const mockUser: User = {
        id: String(Date.now()),
        email,
        name,
        role: 'self-learner',
        createdAt: new Date().toISOString()
      };
      const mockToken = 'mock-jwt-token';
      localStorage.setItem('authToken', mockToken);
      setUser(mockUser);
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
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
