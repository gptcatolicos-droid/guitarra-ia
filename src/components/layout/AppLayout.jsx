import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';
import BrandLogo from './BrandLogo';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isImmersiveChat = location.pathname === '/chat';

  // Ensure page background matches the light design system
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.backgroundColor = '#F8F9FB';
  }, []);

  // Push AdSense ads
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [location.pathname]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FB', color: '#1F2937' }}>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 grid grid-cols-[48px_minmax(0,1fr)_48px] items-center px-4"
        style={{
          height: '68px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
          style={{ color: '#6B7280' }}
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <BrandLogo className="justify-self-center brand-logo-mobile" />
        <div className="w-11 shrink-0" />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main
        className="main-area lg:ml-[240px] pt-[68px] lg:pt-0 pb-[calc(66px+24px+env(safe-area-inset-bottom))] lg:!pb-0 min-w-0 w-full"
        style={{ backgroundColor: '#F8F9FB' }}
      >
        <Outlet />
        {!isImmersiveChat && (
          <>
            {/* AdSense before footer */}
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4">
              <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-3924083038235099"
                data-ad-slot="auto"
                data-ad-format="auto"
                data-full-width-responsive="true" />
            </div>
            <Footer />
          </>
        )}
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}
