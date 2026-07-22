import { Link, useLocation } from 'react-router-dom';
import {
  Home, Users, LayoutGrid,
  BookOpen, ShoppingBag, X, MessageCircleMore
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Users, label: 'Artistas', path: '/artistas' },
  { icon: LayoutGrid, label: 'Acordes', path: '/acordes' },
  { icon: BookOpen, label: 'Blog', path: '/blog' },
  { icon: ShoppingBag, label: 'Guitar Store', path: '/tienda', newTab: true },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col transform transition-transform duration-250 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: '240px',
          backgroundColor: '#0E1112',
          borderRight: '1px solid #272C2F',
        }}
      >
        {/* Top close button (mobile only, no logo) */}
        <div
          className="flex items-center justify-end px-4 lg:hidden"
          style={{ height: '56px', borderBottom: '1px solid #272C2F', flexShrink: 0 }}
        >
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: '#747B7F' }}
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Desktop: empty top spacer matching header height */}
        <div className="hidden lg:block" style={{ height: '64px', borderBottom: '1px solid #272C2F', flexShrink: 0 }} />

        {/* Chat IA — top prominent button */}
        <div className="px-3 pt-4 pb-2">
          <Link
            to="/chat"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 w-full"
            style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)', color: '#fff' }}
          >
            <MessageCircleMore className="w-5 h-5 shrink-0" />
            <span>Chat IA</span>
            <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">IA</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                target={item.newTab ? '_blank' : undefined}
                rel={item.newTab ? 'noopener noreferrer' : undefined}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={active ? {
                  backgroundColor: 'rgba(255,114,0,0.12)',
                  color: '#FF7200',
                } : {
                  color: '#A7ACAE',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#181B1D'; e.currentTarget.style.color = '#F4F4F2'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A7ACAE'; } }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ backgroundColor: '#FF7200' }}
                  />
                )}
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FF7200', color: '#fff' }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Chat IA CTA — main action */}
        <div className="p-3 pb-5" style={{ borderTop: '1px solid #272C2F' }}>
          <Link
            to="/chat"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)', color: '#fff' }}
          >
            <MessageCircleMore className="w-5 h-5 shrink-0" />
            <span>Chat IA</span>
            <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">GRATIS</span>
          </Link>
        </div>
      </aside>
    </>
  );
}