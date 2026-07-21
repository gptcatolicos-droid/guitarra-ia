import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import Sidebar from './Sidebar';

const LOGO_URL = 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png';

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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground w-8">
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <img src={LOGO_URL} alt="Tablaturas AI" className="h-12 object-contain" />
        </Link>
        <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground w-8 flex justify-end">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[260px] pt-16 lg:pt-0 min-h-screen">
        {/* Desktop header — logo centrado grande */}
        <div className="hidden lg:flex items-center justify-between gap-4 px-8 py-4 border-b border-border bg-card sticky top-0 z-20">
          <Link to="/">
            <img src={LOGO_URL} alt="Tablaturas AI" className="h-20 object-contain" />
          </Link>
          <button onClick={toggleTheme} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}