import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, LayoutGrid, BookOpen } from 'lucide-react';

const items = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: LayoutGrid, label: 'Acordes', path: '/acordes' },
  { icon: BookOpen, label: 'Blog', path: '/blog' },
];

export default function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isChatActive = location.pathname === '/chat';

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center"
      style={{
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: '#0E1112',
        borderTop: '1px solid #272C2F',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.30)',
      }}
    >
      {/* Regular items */}
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
            style={{ color: active ? '#FF7200' : '#747B7F' }}
            aria-label={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}

      {/* Chat IA — prominent center-right button */}
      <div className="flex-1 flex items-center justify-center px-2">
        <Link
          to="/chat"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-opacity hover:opacity-90"
          style={{
            background: isChatActive ? 'linear-gradient(135deg, #D95D00 0%, #FF7200 100%)' : 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(255,114,0,0.4)',
          }}
          aria-label="Chat IA"
        >
          <Sparkles className="w-4 h-4" />
          <span>Chat IA</span>
        </Link>
      </div>
    </div>
  );
}