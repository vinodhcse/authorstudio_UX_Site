import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, AuthResponse } from '../lib/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
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
    // Check if user is already authenticated on app start
    const initializeAuth = async () => {
      try {
        const currentUser = await apiClient.getCurrentUser();
        if (currentUser.token && currentUser.userId) {
          setUser({
            id: currentUser.userId,
            name: currentUser.name || '',
            email: currentUser.email || '',
            role: currentUser.role || 'FREE_USER',
          });
        }
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const deviceId = await apiClient.generateDeviceId();
      const response: AuthResponse = await apiClient.login({
        email,
        password,
        deviceId,
      });

      setUser({
        id: response.userId,
        name: response.name || '',
        email: response.email || email,
        role: response.globalRole || 'FREE_USER',
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const deviceId = await apiClient.generateDeviceId();
      const response: AuthResponse = await apiClient.signup({
        name,
        email,
        password,
        deviceId,
      });

      setUser({
        id: response.userId,
        name: name,
        email: email,
        role: 'FREE_USER',
      });
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  const refreshToken = async (): Promise<void> => {
    try {
      await apiClient.refreshToken();
      // User data should remain the same, just token refreshed
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(); // Force logout if refresh fails
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
