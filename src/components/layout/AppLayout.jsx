import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/968039181_78E3ED32-6DA5-40A1-96F9-5E53E711C696.png';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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
        <Link to="/" className="flex min-w-0 items-center justify-center">
          <img src={LOGO_URL} alt="Guitarra IA" style={{ height: '36px', maxWidth: '100%', width: 'auto', objectFit: 'contain' }} />
        </Link>
        <div className="w-11 shrink-0" />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main
        className="main-area lg:ml-[240px] pt-[68px] lg:pt-0 pb-[calc(66px+24px+env(safe-area-inset-bottom))] lg:!pb-0 min-w-0 w-full"
        style={{ backgroundColor: '#F8F9FB' }}
      >
        {/* Desktop header */}
        <div
          className="hidden lg:flex items-center justify-center"
          style={{
            height: '104px',
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <Link to="/" className="flex items-center justify-center" style={{ height: '104px' }}>
            <img src={LOGO_URL} alt="Guitarra IA" style={{ width: '210px', height: 'auto', maxHeight: '84px', objectFit: 'contain' }} />
          </Link>
        </div>

        <Outlet />
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
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}