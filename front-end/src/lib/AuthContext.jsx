import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: "app",
    public_settings: {}
  });

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const profile = await api.getMe();
      setUser(profile);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      console.warn('Auth validation failed, setting unauthenticated state:', err.message);
      // Check for user registration states from backend responses
      if (err.message && err.message.includes('user_not_registered')) {
        setAuthError({ type: 'user_not_registered' });
      } else {
        setAuthError({ type: 'auth_required' });
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkAppState = async () => {};
  
  const logout = () => {
    localStorage.removeItem('supabase_access_token');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  const navigateToLogin = () => {
    checkUserAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

