import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Search, Users, Settings, X, Sparkles, Sun, Moon, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

const LOGO_URL = 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png';
const ADMIN_EMAIL = 'danipalacio@gmail.com';

const navItems = [
  { icon: MessageCircle, label: 'Chat IA', path: '/' },
  { icon: Search, label: 'Buscar canciones', path: '/buscar' },
  { icon: Users, label: 'Artistas', path: '/buscar?tab=artistas' },
  { icon: Settings, label: 'Ajustes', path: '/ajustes' },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path) => location.pathname === path.split('?')[0] && (path === '/' ? location.pathname === '/' : true);

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
        className={`fixed top-0 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo — bigger, proper aspect ratio */}
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex-1">
            <img
              src={LOGO_URL}
              alt="Tablaturas AI"
              style={{ aspectRatio: '1127/410' }}
              className="w-full max-w-[200px] object-contain"
            />
          </Link>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}

          {user?.email === ADMIN_EMAIL && (
            <Link
              to="/admin"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                isActive('/admin')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
              }`}
            >
              <Shield className="w-[18px] h-[18px]" />
              Admin
            </Link>
          )}
        </nav>

        <div className="px-3 py-2 border-t border-sidebar-border">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent/30 hover:text-foreground"
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>

        <div className="p-3">
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
            <Sparkles className="w-5 h-5 text-primary mb-2" />
            <p className="text-foreground text-sm font-semibold mb-1">¡Plataforma gratuita!</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Todas las funciones están disponibles sin costo durante el lanzamiento.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}