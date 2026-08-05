import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#0B0D0E' }}>
    <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#FF7200' }} />
  </div>
);

export default function AdminRoute({ loginPath = '/supercalifragilisticoespialidoso/acceso' }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) checkUserAuth();
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  useEffect(() => {
    if (authChecked && !isLoadingAuth && !isAuthenticated) {
      navigate(`${loginPath}?from=${encodeURIComponent(window.location.pathname)}`, { replace: true });
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, loginPath, navigate]);

  if (isLoadingAuth || !authChecked || !isAuthenticated || authError) return <LoadingScreen />;

  if (!user || user.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#0B0D0E' }}>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#F4F4F2' }}>Acceso restringido</h1>
        <p className="text-sm" style={{ color: '#A7ACAE' }}>Tu cuenta no tiene permisos de administrador.</p>
      </div>
    );
  }

  return <Outlet />;
}
