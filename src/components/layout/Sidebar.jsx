import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Search, Users, Music, X, Sun, Moon, LayoutGrid, ShoppingBag, Sparkles } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { icon: MessageCircle, label: 'Chat IA', path: '/chat' },
  { icon: Search, label: 'Explorar', path: '/buscar' },
  { icon: Users, label: 'Artistas', path: '/artistas' },
  { icon: Music, label: 'Canciones', path: '/canciones' },
  { icon: LayoutGrid, label: 'Acordes', path: '/acordes' },
  { icon: ShoppingBag, label: 'Guitar Store', path: '/tienda' },
];

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

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
        className={`fixed top-0 left-0 bottom-0 w-[236px] z-50 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,.015), transparent 28%), #1F2126',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Mobile close */}
        <div className="lg:hidden px-4 pt-4 pb-2 flex justify-end">
          <button onClick={onClose} className="text-white/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center px-4 py-5 border-b border-white/[0.06]">
          <Link to="/" onClick={onClose}>
            <img
              src={LOGO_URL}
              alt="Guitarra IA"
              style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(212,175,55,0.2))' }}
            />
          </Link>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 flex-1 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className="relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[13px] text-sm font-semibold transition-all duration-150 group"
                style={active ? {
                  color: '#FFFFFF',
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.20), rgba(245,154,35,0.08)), #31343A',
                } : {
                  color: 'rgba(248,247,244,0.75)',
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ background: 'linear-gradient(135deg, #B89245, #F59A23)', boxShadow: '0 0 14px rgba(212,175,55,0.4)' }}
                  />
                )}
                <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-gold' : 'text-white/50 group-hover:text-white/80'}`}
                  style={active ? { color: '#D4AF37' } : {}} />
                <span className={`transition-colors ${active ? '' : 'group-hover:text-white'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="px-3 pb-2 border-t border-white/[0.06] pt-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[13px] text-sm font-medium transition-all text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>

        {/* Bottom card */}
        <div className="p-3 pb-4">
          <div
            className="rounded-[18px] p-4"
            style={{
              background: 'linear-gradient(180deg, rgba(212,175,55,0.10), rgba(255,255,255,0.02))',
              border: '1px solid rgba(212,175,55,0.22)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <p className="text-white text-sm font-bold">Asistente Musical con IA</p>
            </div>
            <p className="text-white/65 text-xs leading-relaxed mb-3">
              Tu compañero inteligente para aprender cualquier canción en guitarra.
            </p>
            <Link
              to="/chat"
              onClick={onClose}
              className="block text-center text-xs font-bold py-2 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #B89245, #D4AF37, #F59A23)', color: '#fff' }}
            >
              Probar ahora
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}