import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Sparkles, ShoppingBag } from 'lucide-react';

const items = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Search, label: 'Buscar', path: '/buscar' },
  { icon: Sparkles, label: 'IA', path: '/chat' },
  { icon: ShoppingBag, label: 'Tienda', path: '/tienda' },
];

export default function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around"
      style={{
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: '#0E1112',
        borderTop: '1px solid #272C2F',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.30)',
      }}
    >
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
            style={{ color: active ? '#FF7200' : '#747B7F', minHeight: '44px' }}
            aria-label={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}