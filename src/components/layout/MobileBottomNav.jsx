import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, LayoutGrid, BookOpen, Images } from 'lucide-react';

const items = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: LayoutGrid, label: 'Acordes', path: '/acordes' },
  { icon: BookOpen, label: 'Blog', path: '/blog' },
  { icon: Images, label: 'Infografías', path: '/infografias' },
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch px-1"
      style={{
        height: 'calc(66px + env(safe-area-inset-bottom))',
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
            className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-colors"
            style={{ color: active ? '#FF7200' : '#747B7F' }}
            aria-label={item.label}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">{item.label}</span>
          </Link>
        );
      })}

      {/* Chat IA — compact accent tab, same footprint as the others */}
      <Link
        to="/chat"
        className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0"
        style={{ color: isChatActive ? '#FF7200' : '#FF7200' }}
        aria-label="Chat IA"
      >
        <span
          className="flex items-center justify-center rounded-xl"
          style={{
            width: '34px', height: '30px',
            background: isChatActive ? 'linear-gradient(135deg, #D95D00 0%, #FF7200 100%)' : 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)',
            boxShadow: '0 3px 12px rgba(255,114,0,0.4)',
          }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </span>
        <span className="text-[10px] font-bold leading-none">Chat IA</span>
      </Link>
    </div>
  );
}