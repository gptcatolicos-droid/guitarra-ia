import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    else { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    setIsDark(!isDark);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
        <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <form onSubmit={handleSearch} className="flex-1 flex items-center bg-background border border-border rounded-xl px-3 py-1.5 gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Buscar canciones, artistas..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
          />
        </form>
        <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[260px] pt-14 lg:pt-0 min-h-screen">
        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center gap-4 px-8 py-4 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-20">
          <form onSubmit={handleSearch} className="flex-1 max-w-xl flex items-center bg-background border border-border rounded-xl px-4 py-2.5 gap-3 focus-within:border-orange-400 transition-colors">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Buscar canciones, artistas, acordes o tablaturas..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
            />
          </form>
          <button onClick={toggleTheme} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}