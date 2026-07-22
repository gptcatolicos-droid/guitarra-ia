import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { Search, TrendingUp, Music, Zap, ChevronRight, Star, BookOpen } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

const QUICK_CHIPS = [
  'Canciones fáciles', 'Cuatro acordes', 'Rock en español', 'Baladas', 'Guitarra acústica', 'Para principiantes',
];

const GENRES = [
  { label: 'Rock', emoji: '🎸' },
  { label: 'Pop', emoji: '🎤' },
  { label: 'Baladas', emoji: '🕯️' },
  { label: 'Reggae', emoji: '🌿' },
  { label: 'Blues', emoji: '🎵' },
  { label: 'Latin', emoji: '💃' },
  { label: 'Folk', emoji: '🪕' },
  { label: 'Alternativo', emoji: '⚡' },
];

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(128,185,64,0.15)', color: '#80B940' },
  'Intermedia': { bg: 'rgba(216,166,42,0.15)', color: '#D8A62A' },
  'Avanzada': { bg: 'rgba(217,90,50,0.15)', color: '#D95A32' },
};

function SongCard({ song }) {
  const diff = DIFF_COLORS[song.difficulty] || DIFF_COLORS['Fácil'];
  return (
    <Link
      to={`/${song.artist_slug}/${song.slug}`}
      className="flex flex-col rounded-xl overflow-hidden transition-all duration-150 group"
      style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#444A4E'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div className="aspect-square bg-g-surface flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#121516' }}>
        <Music className="w-8 h-8" style={{ color: '#303538' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug line-clamp-1 mb-0.5" style={{ color: '#F4F4F2' }}>
          {song.title}
        </p>
        <p className="text-xs mb-2" style={{ color: '#747B7F' }}>{song.artist_name}</p>
        {song.difficulty && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: diff.bg, color: diff.color }}>
            {song.difficulty}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [topSongs, setTopSongs] = useState([]);
  const [easySongs, setEasySongs] = useState([]);

  useSEO({
    title: 'Guitarra IA — Acordes, tablaturas y asistente IA | guitarraia.com',
    description: 'Busca acordes, tablaturas y cifrados de guitarra con inteligencia artificial. El mejor asistente musical para guitarristas en guitarraia.com.',
    image: LOGO_URL,
    canonical: 'https://www.guitarraia.com/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Guitarra IA',
      url: 'https://www.guitarraia.com',
      description: 'Plataforma de acordes, tablaturas y asistente IA para guitarristas hispanohablantes.',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://www.guitarraia.com/buscar?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
  });

  useEffect(() => {
    base44.entities.Song.filter({ is_trending: true }, '-views', 10)
      .then(s => { if (s?.length) setTopSongs(s); else base44.entities.Song.list('-views', 10).then(setTopSongs); })
      .catch(() => base44.entities.Song.list('-views', 10).then(setTopSongs).catch(() => {}));
    base44.entities.Song.filter({ difficulty: 'Fácil' }, '-views', 6)
      .then(setEasySongs).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E' }}>

      {/* ===== HERO ===== */}
      <section
        className="relative px-4 lg:px-8 py-16 lg:py-24"
        style={{
          background: 'linear-gradient(180deg, #121516 0%, #0B0D0E 100%)',
          borderBottom: '1px solid #272C2F',
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight" style={{ color: '#F4F4F2' }}>
            Toca tus canciones{' '}
            <span style={{ color: '#FF7200' }}>favoritas</span>
          </h1>
          <p className="text-base lg:text-lg mb-8" style={{ color: '#A7ACAE' }}>
            Acordes, tablaturas y herramientas para aprender, practicar y tocar mejor.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#747B7F' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar canciones, artistas, acordes o géneros…"
              className="w-full pl-12 pr-28 py-4 rounded-xl text-base outline-none transition-all"
              style={{
                backgroundColor: '#171A1C',
                border: '1px solid #303538',
                color: '#F4F4F2',
                caretColor: '#FF7200',
              }}
              onFocus={e => { e.target.style.borderColor = '#FF7200'; }}
              onBlur={e => { e.target.style.borderColor = '#303538'; }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FF7200', color: '#fff' }}
            >
              Buscar
            </button>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => navigate(`/buscar?q=${encodeURIComponent(chip)}`)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: '#181B1D',
                  border: '1px solid #303538',
                  color: '#A7ACAE',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF7200'; e.currentTarget.style.color = '#FF7200'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#303538'; e.currentTarget.style.color = '#A7ACAE'; }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRENDING ===== */}
      {topSongs.length > 0 && (
        <section className="px-4 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: '#FF7200' }} />
                <h2 className="text-xl font-bold" style={{ color: '#F4F4F2' }}>En tendencia</h2>
              </div>
              <Link to="/canciones" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#FF7200' }}>
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {topSongs.slice(0, 10).map(song => <SongCard key={song.id} song={song} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== EASY SONGS ===== */}
      {easySongs.length > 0 && (
        <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #272C2F' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" style={{ color: '#80B940' }} />
                <h2 className="text-xl font-bold" style={{ color: '#F4F4F2' }}>Canciones fáciles</h2>
              </div>
              <Link to="/canciones" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#FF7200' }}>
                Ver más <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-1">
              {easySongs.map((song, i) => (
                <Link
                  key={song.id}
                  to={`/${song.artist_slug}/${song.slug}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#181B1D'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span className="text-sm font-bold w-5 text-right shrink-0" style={{ color: '#303538' }}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
                    <Music className="w-4 h-4" style={{ color: '#444A4E' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{song.title}</p>
                    <p className="text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: 'rgba(128,185,64,0.15)', color: '#80B940' }}>
                    Fácil
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== GENRES ===== */}
      <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #272C2F' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold mb-5" style={{ color: '#F4F4F2' }}>Explorar por género</h2>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            {GENRES.map(g => (
              <Link
                key={g.label}
                to={`/buscar?q=${encodeURIComponent(g.label)}`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all"
                style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,114,0,0.45)'; e.currentTarget.style.backgroundColor = 'rgba(255,114,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; e.currentTarget.style.backgroundColor = '#181B1D'; }}
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className="text-xs font-medium" style={{ color: '#A7ACAE' }}>{g.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== IA BLOCK ===== */}
      <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #272C2F' }}>
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8"
            style={{
              background: 'linear-gradient(135deg, rgba(255,114,0,0.10) 0%, rgba(255,114,0,0.04) 100%)',
              border: '1px solid rgba(255,114,0,0.25)',
            }}
          >
            <Zap className="w-10 h-10 shrink-0" style={{ color: '#FF7200' }} />
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1" style={{ color: '#F4F4F2' }}>¿Tienes una duda?</h2>
              <p style={{ color: '#A7ACAE' }} className="text-sm">
                Pregunta a GuitarraIA sobre acordes, ritmos, tonos o canciones. Tu asistente musical inteligente.
              </p>
            </div>
            <Link
              to="/chat"
              className="shrink-0 px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FF7200', color: '#fff' }}
            >
              Preguntar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ===== BLOG ===== */}
      <section className="px-4 lg:px-8 py-8 pb-12" style={{ borderTop: '1px solid #272C2F' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: '#FF7200' }} />
              <h2 className="text-xl font-bold" style={{ color: '#F4F4F2' }}>Aprende con GuitarraIA</h2>
            </div>
            <Link to="/blog" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#FF7200' }}>
              Ver blog <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: 'Cómo tocar guitarra para principiantes', cat: 'Técnica', slug: 'como-tocar-guitarra-para-principiantes' },
              { title: '20 canciones fáciles para principiantes', cat: 'Canciones', slug: 'canciones-faciles-guitarra-principiantes' },
              { title: 'Tipos de guitarras eléctricas', cat: 'Guitarras', slug: 'tipos-guitarras-electricas-guia' },
            ].map(art => (
              <Link
                key={art.slug}
                to={`/blog/${art.slug}`}
                className="flex items-start gap-3 p-4 rounded-xl transition-all"
                style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#444A4E'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
              >
                <BookOpen className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#FF7200' }} />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#747B7F' }}>{art.cat}</span>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '#F4F4F2' }}>{art.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}