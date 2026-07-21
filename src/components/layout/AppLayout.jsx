import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
import Sidebar from './Sidebar';

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
      {/* Mobile top bar — only burger + theme toggle, no search */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[260px] pt-14 lg:pt-0 min-h-screen">
        {/* Desktop top bar — only theme toggle, no search */}
        <div className="hidden lg:flex items-center justify-end gap-4 px-8 py-4 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-20">
          <button onClick={toggleTheme} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}