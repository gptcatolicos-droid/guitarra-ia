import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, LayoutGrid, PlayCircle, Radio } from 'lucide-react';
import { useNavigationVisibility } from '@/lib/navigationVisibility';

const items = [
  { key: 'practice', icon: PlayCircle, label: 'Práctica', path: '/practicar' },
  { key: 'home', icon: Home, label: 'Inicio', path: '/' },
  { key: 'tuner', icon: Radio, label: 'Afinador', path: '/afinador' },
  { key: 'chords', icon: LayoutGrid, label: 'Acordes', path: '/acordes' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const visibility = useNavigationVisibility();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isChatActive = location.pathname === '/chat';
  const visibleItems = items.filter((item) => visibility[item.key] !== false);
  const showChat = visibility.chat !== false;

  if (!visibleItems.length && !showChat) return null;

  return (
    <div
      className="bottom-navigation lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch px-1"
      style={{
        height: 'calc(66px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        boxShadow: '0 -8px 24px rgba(15,23,42,0.06)',
      }}
    >
      {visibleItems.map((item) => {
        const active = isActive(item.path);
        return (
          <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-colors" style={{ color: active ? '#F97316' : '#9CA3AF' }} aria-label={item.label}>
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">{item.label}</span>
          </Link>
        );
      })}

      {showChat && (
        <Link to="/chat" className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0" style={{ color: '#F97316' }} aria-label="Chat IA">
          <span className="flex items-center justify-center rounded-xl" style={{ width: '34px', height: '30px', background: isChatActive ? 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)' : 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)', boxShadow: '0 3px 10px rgba(249,115,22,0.28)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span className="text-[10px] font-bold leading-none">Chat IA</span>
        </Link>
      )}
    </div>
  );
}
