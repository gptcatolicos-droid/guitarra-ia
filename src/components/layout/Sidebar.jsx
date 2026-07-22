import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Home, Search, Users, Music, LayoutGrid,
  BookOpen, ShoppingBag, MessageCircle, X, Library
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Search, label: 'Buscar', path: '/buscar' },
  { icon: Music, label: 'Canciones', path: '/canciones' },
  { icon: Users, label: 'Artistas', path: '/artistas' },
  { icon: LayoutGrid, label: 'Acordes', path: '/acordes' },
  { icon: BookOpen, label: 'Blog', path: '/blog' },
  { icon: Library, label: 'Biblioteca', path: '/favoritos' },
  { icon: MessageCircle, label: 'Asistente IA', path: '/chat' },
  { icon: ShoppingBag, label: 'Guitar Store', path: '/tienda' },
];

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

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
        {/* Logo area */}
        <div
          className="flex items-center justify-between px-5"
          style={{ height: '64px', borderBottom: '1px solid #272C2F', flexShrink: 0 }}
        >
          <Link to="/" onClick={onClose}>
            <img src={LOGO_URL} alt="Guitarra IA" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: '#747B7F' }}
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom promo */}
        <div className="p-3 pb-5" style={{ borderTop: '1px solid #272C2F' }}>
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,114,0,0.08)',
              border: '1px solid rgba(255,114,0,0.25)',
            }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: '#F4F4F2' }}>Asistente IA</p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: '#747B7F' }}>
              Pregunta sobre acordes, tonos, canciones y técnica.
            </p>
            <Link
              to="/chat"
              onClick={onClose}
              className="block text-center text-xs font-bold py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FF7200', color: '#fff' }}
            >
              Preguntar ahora
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}