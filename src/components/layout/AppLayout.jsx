import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import Sidebar from './Sidebar';
import Footer from './Footer';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    else { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    setIsDark(!isDark);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3 border-b border-border"
        style={{ height: '64px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <button onClick={() => setSidebarOpen(true)} className="text-foreground/60 hover:text-foreground w-9 h-9 flex items-center justify-center">
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex-1 flex justify-center">
          <img src={LOGO_URL} alt="Guitarra IA" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
        </Link>
        <button onClick={toggleTheme} className="text-foreground/60 hover:text-foreground w-9 h-9 flex items-center justify-center">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[236px] pt-[64px] lg:pt-0 min-h-screen">
        {/* Desktop topbar */}
        <div
          className="hidden lg:flex items-center justify-between px-7 border-b border-border sticky top-0 z-20"
          style={{
            height: '72px',
            background: 'rgba(244,242,239,0.92)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div className="w-10" />
          <Link to="/" className="flex-1 flex justify-center">
            <img
              src={LOGO_URL}
              alt="Guitarra IA"
              style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 3px 8px rgba(212,175,55,0.15))' }}
            />
          </Link>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card hover:border-gold/40 transition-all shadow-sm text-foreground/70 hover:text-foreground"
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}