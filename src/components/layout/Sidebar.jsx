import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Search, Users, Music, X, Sun, Moon, LayoutGrid, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { icon: MessageCircle, label: 'Chat IA', path: '/chat' },
  { icon: Search, label: 'Explorar', path: '/buscar' },
  { icon: Users, label: 'Artistas', path: '/artistas' },
  { icon: Music, label: 'Canciones', path: '/canciones' },
  { icon: LayoutGrid, label: 'Acordes', path: '/acordes' },
  { icon: ShoppingBag, label: 'Guitar Store', path: '/tienda' },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

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
        {/* Mobile close button */}
        <div className="lg:hidden px-4 pt-4 pb-2 flex justify-end">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spacer on desktop so nav starts below the header */}
        <div className="hidden lg:block" style={{ height: '120px' }} />

        {/* Nav */}
        <nav className="px-3 py-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors text-left ${
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