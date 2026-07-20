import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Search, Users, Heart, Clock, Settings, X, Sparkles } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png';

const navItems = [
  { icon: MessageCircle, label: 'Chat', path: '/' },
  { icon: Search, label: 'Buscar canciones', path: '/buscar' },
  { icon: Users, label: 'Artistas', path: '/buscar?tab=artistas' },
  { icon: Heart, label: 'Favoritos', path: '/favoritos' },
  { icon: Clock, label: 'Recientes', path: '/recientes' },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-[#1a1d21] border-r border-[#2b3138] z-50 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <img src={LOGO_URL} alt="Tablaturas AI" className="h-16 w-auto" />
          </Link>
          <button onClick={onClose} className="lg:hidden text-[#a7afb8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path.split('?')[0]) && (item.path === '/' ? location.pathname === '/' : true);
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                  active
                    ? 'bg-[#ff7a00]/10 text-[#ff7a00]'
                    : 'text-[#a7afb8] hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-2 border-t border-[#2b3138]">
          <Link
            to="/ajustes"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/ajustes') ? 'bg-[#ff7a00]/10 text-[#ff7a00]' : 'text-[#a7afb8] hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
            Ajustes
          </Link>

        </div>

        <div className="p-3">
          <div className="bg-gradient-to-br from-[#ff7a00]/20 to-[#ff7a00]/5 border border-[#ff7a00]/30 rounded-xl p-4">
            <Sparkles className="w-5 h-5 text-[#ff7a00] mb-2" />
            <p className="text-white text-sm font-semibold mb-1">¡Plataforma gratuita!</p>
            <p className="text-[#a7afb8] text-xs leading-relaxed">
              Todas las funciones están disponibles sin costo durante el lanzamiento.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}