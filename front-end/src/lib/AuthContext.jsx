import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { api } from '@/lib/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: "app",
    public_settings: {}
  });

  const checkUserAuth = async () => {
    if (!authChecked) {
      setIsLoadingAuth(true);
    }
    try {
      let profile = await api.getMe();

      // Auto-claim pending invite if one exists in localStorage
      const pendingInviteId = localStorage.getItem('pending_invite_id');
      if (pendingInviteId && profile) {
        try {
          console.log('[AuthContext] Attempting to auto-claim pending invite:', pendingInviteId);
          await api.claimInvite(pendingInviteId);
          localStorage.removeItem('pending_invite_id');
          // Fetch updated profile after claiming
          profile = await api.getMe();
        } catch (inviteErr) {
          console.error('[AuthContext] Failed to claim pending invite:', inviteErr);
        }
      }

      setUser(profile);
      setIsAuthenticated(true);
      setAuthError(null);

      // Check if profile is incomplete (missing birthDate/birthYear or phone, or default generic name)
      const isDefaultName = profile.name && (
        profile.name.toLowerCase() === 'first name last name' || 
        profile.name.toLowerCase().startsWith('first name')
      );
      if (!profile.birthYear || isDefaultName) {
        setIsProfileIncomplete(true);
      } else {
        setIsProfileIncomplete(false);
      }
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
      setIsProfileIncomplete(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('supabase_access_token', session.access_token);
        checkUserAuth();
      } else {
        localStorage.removeItem('supabase_access_token');
        setIsLoadingAuth(false);
        setAuthChecked(true);
        setIsAuthenticated(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem('supabase_access_token', session.access_token);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkUserAuth();
        }
      } else {
        localStorage.removeItem('supabase_access_token');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {};

  const signUp = async (email, password, firstName, lastName, extraFields = {}) => {
    setAuthError(null);
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          family_branch_name: extraFields.familyBranchName || null,
          phone: extraFields.phone || null,
          location: extraFields.location || null,
          birth_date: extraFields.birthDate || null,
          avatar_url: extraFields.avatarUrl || null,
          invite_id: extraFields.inviteId || null,
        },
      },
    });

    if (error) {
      throw error;
    }
    sessionStorage.setItem('just_logged_in', 'true');
    return data;
  };

  const signIn = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
    sessionStorage.setItem('just_logged_in', 'true');
    return data;
  };
  
  const signInWithGoogle = async (inviteId = null) => {
    setAuthError(null);
    if (inviteId) {
      localStorage.setItem('pending_invite_id', inviteId);
    }
    sessionStorage.setItem('just_logged_in', 'true');
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      throw error;
    }
    return data;
  };
  
  const resetPassword = async (email) => {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const logout = async () => {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('supabase_access_token');
    setUser(null);
    setIsAuthenticated(false);
    setIsProfileIncomplete(false);
    setAuthError(null);
  };
  
  const navigateToLogin = () => {
    // Will be handled by Router redirects
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isProfileIncomplete,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      resetPassword,
      updatePassword,
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

