import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#0B0D0E' }}>
    <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#FF7200' }} />
  </div>
);

/**
 * Guards admin-only routes.
 * - Not authenticated  -> redirect to Base44 login.
 * - Authenticated but not platform admin -> "no access" screen.
 * - Authenticated admin -> render nested routes.
 * NOTE: real enforcement also lives in entity RLS + backend functions
 * (role !== 'admin' is rejected server-side). This is the UI gate.
 */
export default function AdminRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth, navigateToLogin, user } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  useEffect(() => {
    if (authChecked && !isLoadingAuth && !isAuthenticated) {
      navigateToLogin();
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, navigateToLogin]);

  if (isLoadingAuth || !authChecked) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || authError) {
    // Redirect handled by effect above; show loader meanwhile
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#0B0D0E' }}>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#F4F4F2' }}>Acceso restringido</h1>
        <p className="text-sm" style={{ color: '#A7ACAE' }}>
          Tu cuenta no tiene permisos de administrador para acceder a este panel.
        </p>
      </div>
    );
  }

  return <Outlet />;
}