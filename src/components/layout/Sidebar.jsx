import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Search, Users, Music, Settings, X, Sun, Moon, Heart, Clock, BookOpen } from 'lucide-react';
import { useState } from 'react';

const LOGO_URL = 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png';

const navItems = [
  { icon: MessageCircle, label: 'Chat IA', path: '/' },
  { icon: Search, label: 'Explorar', path: '/buscar' },
  { icon: Users, label: 'Artistas', path: '/buscar?tab=artistas' },
  { icon: Music, label: 'Canciones', path: '/buscar?tab=canciones' },
  { icon: BookOpen, label: 'Acordes', path: '/buscar?tab=acordes' },
  { icon: Heart, label: 'Favoritos', path: '/favoritos' },
  { icon: Clock, label: 'Recientes', path: '/recientes' },
  { icon: Settings, label: 'Ajustes', path: '/ajustes' },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  const isActive = (path) => {
    const base = path.split('?')[0];
    if (base === '/') return location.pathname === '/';
    return location.pathname === base;
  };

  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-sidebar border-r border-sidebar-border z-50 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex-1">
            <img
              src={LOGO_URL}
              alt="Tablaturas AI"
              style={{ aspectRatio: '1127/410' }}
              className="w-full max-w-[190px] object-contain"
            />
          </Link>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground ml-2 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors ${
                  active
                    ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-orange-500' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="px-3 pb-2 border-t border-sidebar-border pt-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>

        {/* Bottom card */}
        <div className="p-3">
          <div className="rounded-2xl p-4" style={{ background: 'var(--gradient-brand)' }}>
            <p className="text-white text-sm font-bold mb-0.5">¡Completamente gratis!</p>
            <p className="text-white/80 text-xs leading-relaxed">
              Chat IA · Acordes · Tablaturas · Asistente musical siempre disponible.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}