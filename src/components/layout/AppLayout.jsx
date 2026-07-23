import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Restore dark class always (design system is always dark)
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = '#0B0D0E';
  }, []);

  // Push AdSense ads
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [location.pathname]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E', color: '#F4F4F2' }}>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{
          height: '68px',
          backgroundColor: '#0E1112',
          borderBottom: '1px solid #272C2F',
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
          style={{ color: '#A7ACAE' }}
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center">
          <img src={LOGO_URL} alt="Guitarra IA" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
        </Link>
        <div className="w-11 shrink-0" />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main
        className="lg:ml-[240px] pt-[68px] lg:pt-0 pb-[calc(66px+24px+env(safe-area-inset-bottom))] lg:!pb-0 min-w-0 overflow-x-hidden"
        style={{ backgroundColor: '#0B0D0E' }}
      >
        {/* Desktop header — logo 330px height */}
        <div
          className="hidden lg:flex items-center justify-center"
          style={{
            height: '330px',
            backgroundColor: 'rgba(11,13,14,0.92)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid #272C2F',
          }}
        >
          <Link to="/" className="flex items-center justify-center" style={{ height: '330px' }}>
            <img src={LOGO_URL} alt="Guitarra IA" style={{ height: '280px', width: 'auto', objectFit: 'contain' }} />
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