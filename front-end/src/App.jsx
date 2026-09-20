import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { App as CapacitorApp } from '@capacitor/app';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { isNativePlatform } from '@/lib/platform';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import CompleteProfileOnboarding from '@/components/CompleteProfileOnboarding';
import AppLoader from '@/components/AppLoader';
import { AppSkeletonShell } from '@/components/kinship/SkeletonLoaders';
import Home, { persistedActiveTab } from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import { useEffect } from 'react';

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, isProfileIncomplete } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativePlatform()) return;

    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [navigate]);

  // Show cinematic splash loader while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    const hasToken = localStorage.getItem('supabase_access_token');
    if (hasToken) {
      return <AppSkeletonShell activeTab={persistedActiveTab} />;
    }
    return <AppLoader />;
  }

  // Handle authentication errors (specifically where user is authenticated via Supabase but has no backend profile)
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render onboarding if user is logged in but has an incomplete profile
  if (isAuthenticated && isProfileIncomplete) {
    return <CompleteProfileOnboarding />;
  }

  // Render routes with guards
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Home /> : <Landing />} 
      />
      <Route 
        path="*" 
        element={isAuthenticated ? <PageNotFound /> : <Navigate to="/" replace />} 
      />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App