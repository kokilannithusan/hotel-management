import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem, storageKeys } from '../utils/storage';

interface AuthState {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  rememberMe: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const stored = getStorageItem<{ isAuthenticated: boolean; user: { email: string; name: string } | null; rememberMe: boolean }>(
      storageKeys.auth,
      { isAuthenticated: false, user: null, rememberMe: false }
    );
    return stored;
  });

  useEffect(() => {
    if (authState.isAuthenticated) {
      setStorageItem(storageKeys.auth, authState);
    }
  }, [authState]);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    // Mock authentication - accept any email/password
    if (email && password) {
      const user = {
        email,
        name: email.split('@')[0],
      };
      setAuthState({
        isAuthenticated: true,
        user,
        rememberMe,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      rememberMe: false,
    });
    removeStorageItem(storageKeys.auth);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
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

