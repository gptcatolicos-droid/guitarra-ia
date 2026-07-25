import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { TrendingUp, Music, ChevronRight, Star, BookOpen, Radio } from 'lucide-react';
import HeroSearchChat from '@/components/home/HeroSearchChat';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

const QUICK_CHIPS = [
  'Canciones fáciles', 'Cuatro acordes', 'Rock en español', 'Baladas', 'Guitarra acústica', 'Para principiantes',
];

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(76,154,42,0.12)', color: '#4C9A2A' },
  'Intermedia': { bg: 'rgba(183,121,31,0.12)', color: '#B7791F' },
  'Avanzada': { bg: 'rgba(194,65,12,0.12)', color: '#C2410C' },
};

function getSpotifyEmbedUrl(raw) {
  if (!raw) return null;
  const match = raw.match(/track\/([A-Za-z0-9]+)/);
  if (match) return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`;
  return null;
}

function SpotifySongCard({ song }) {
  const diff = DIFF_COLORS[song.difficulty];
  const embedUrl = getSpotifyEmbedUrl(song.spotify_embed);

  return (
    <div className="spotify-card flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {embedUrl ? (
        <div className="spotify-embed-wrapper">
          <iframe src={embedUrl} width="100%" height="152" frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy" title={`Spotify: ${song.title}`} />
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ height: '152px', backgroundColor: '#F3F4F6' }}>
          <Music className="w-8 h-8" style={{ color: '#D1D5DB' }} />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold mb-0.5 break-words" style={{ color: '#1F2937' }}>
            {song.title.replace(/\s*\d+$/, '').trim()}
          </p>
          <p className="text-xs break-words" style={{ color: '#6B7280' }}>{song.artist_name}</p>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          {diff && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full self-start sm:self-end" style={{ backgroundColor: diff.bg, color: diff.color }}>{song.difficulty}</span>}
          <Link to={`/${song.artist_slug}/${song.slug}`} className="w-full min-h-12 flex items-center justify-center text-[10px] font-bold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80" style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)', color: '#fff' }}>
            Ver acordes
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [topSongs, setTopSongs] = useState([]);
  const [allSpotifySongs, setAllSpotifySongs] = useState([]);
  const [easySongs, setEasySongs] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useSEO({
    title: 'Guitarra IA — Acordes, tablaturas y asistente IA | guitarraia.com',
    description: 'Busca acordes, tablaturas y cifrados de guitarra con inteligencia artificial.',
    image: LOGO_URL,
    canonical: 'https://www.guitarraia.com/',
  });

  useEffect(() => {
    base44.entities.Song.list('-views', 200)
      .then(songs => {
        const withSpotify = (songs || []).filter(s => s.spotify_embed);
        setTopSongs(withSpotify.slice(0, 3));
        setAllSpotifySongs(withSpotify.slice(0, 9));
      })
      .catch(() => {});
    base44.entities.Song.filter({ difficulty: 'Fácil' }, '-views', 6)
      .then(setEasySongs).catch(() => {});
    base44.entities.BlogPost.filter({ published: true }, '-created_date', 3)
      .then(setBlogPosts).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FB' }}>

      {/* ===== HERO with background photo ===== */}
      <section
        className="home-wave-hero relative px-4 lg:px-8 py-10 lg:py-24 overflow-hidden"
        style={{ borderBottom: '1px solid #E5E7EB' }}
      >
        <div className="absolute inset-0 z-0" style={{ backgroundColor: '#F8F9FB' }} />

        <div className="relative z-10 max-w-2xl mx-auto text-center w-full">
          <h1 className="text-[28px] leading-[1.15] sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#1F2937' }}>
            Toca lo que{' '}
            <span style={{ color: '#F97316' }}>te mueve.</span>
          </h1>
          <p className="text-base lg:text-lg mb-8" style={{ color: '#6B7280' }}>
            Canciones, acordes y una IA para practicar a tu ritmo.
          </p>
          <HeroSearchChat quickChips={QUICK_CHIPS} />
          <Link to="/afinador" className="tuner-promo"><span><Radio className="w-5 h-5" /></span><div><b>Afinador IA</b><small>Afinación precisa con IA en tiempo real.</small></div><em>Abrir afinador</em></Link>
        </div>
      </section>

      {/* ===== TRENDING ===== */}
      {topSongs.length > 0 && (
        <section className="px-4 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="w-5 h-5 shrink-0" style={{ color: '#F97316' }} />
                <h2 className="text-xl font-bold break-words" style={{ color: '#1F2937' }}>Canciones en tendencia</h2>
              </div>
              <Link to="/canciones" className="flex shrink-0 items-center gap-1 text-sm font-medium" style={{ color: '#F97316' }}>
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Desktop: 3 col grid */}
            <div className="hidden sm:grid grid-cols-3 gap-4">
              {topSongs.map(song => <SpotifySongCard key={song.id} song={song} />)}
            </div>
            {/* Mobile: carousel */}
            <div className="sm:hidden">
              <SpotifySongCard song={topSongs[carouselIndex]} />
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => setCarouselIndex(i => (i - 1 + topSongs.length) % topSongs.length)}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div className="flex gap-1.5">
                  {topSongs.map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: i === carouselIndex ? '#F97316' : '#D1D5DB' }} />
                  ))}
                </div>
                <button onClick={() => setCarouselIndex(i => (i + 1) % topSongs.length)}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== CANCIONES (all with Spotify embed) ===== */}
      {allSpotifySongs.length > 3 && (
        <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #E5E7EB' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5" style={{ color: '#F97316' }} />
                <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>Canciones</h2>
              </div>
              <Link to="/canciones" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#F97316' }}>
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allSpotifySongs.map(song => <SpotifySongCard key={song.id} song={song} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== EASY SONGS ===== */}
      {easySongs.length > 0 && (
        <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #E5E7EB' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" style={{ color: '#4C9A2A' }} />
                <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>Canciones fáciles para empezar</h2>
              </div>
              <Link to="/canciones" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#F97316' }}>
                Ver más <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-1">
              {easySongs.map((song, i) => (
                <div key={song.id}
                  className="grid grid-cols-[auto_auto_minmax(0,1fr)] sm:flex sm:items-center gap-4 px-4 py-3 rounded-xl min-w-0"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                >
                  <span className="text-sm font-bold w-5 text-right shrink-0" style={{ color: '#D1D5DB' }}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                    <Music className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>{song.title}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{song.artist_name}</p>
                  </div>
                  <div className="col-span-3 sm:col-auto flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline"
                      style={{ backgroundColor: 'rgba(76,154,42,0.12)', color: '#4C9A2A' }}>
                      Fácil
                    </span>
                    <Link to={`/${song.artist_slug}/${song.slug}`}
                      className="w-full sm:w-auto min-h-11 flex items-center justify-center text-[10px] font-bold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                      style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)', color: '#fff' }}>
                      Ver acordes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* ===== DONATE ===== */}
      <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #E5E7EB' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl px-6 py-5"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div>
            <p className="font-bold text-sm" style={{ color: '#1F2937' }}>¿Te gusta GuitarraIA? 💙</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Con 1 USD nos ayudas a mantener el sitio activo y seguir añadiendo canciones.</p>
          </div>
          <a href="https://paypal.me/schoolmarketing/1" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 shrink-0"
            style={{ backgroundColor: '#0070BA' }}>
            💙 Donar U$1 con PayPal
          </a>
        </div>
      </section>

      {/* ===== BLOG ===== */}
      {blogPosts.length > 0 && (
        <section className="px-4 lg:px-8 py-8 pb-12" style={{ borderTop: '1px solid #E5E7EB' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: '#F97316' }} />
                <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>Aprende con GuitarraIA</h2>
              </div>
              <Link to="/blog" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#F97316' }}>
                Ver blog <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {blogPosts.map(art => (
                <Link key={art.id} to={`/blog/${art.slug}`}
                  className="flex items-start gap-3 p-4 rounded-xl transition-all"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#FDBA74'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
                >
                  <BookOpen className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#F97316' }} />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{art.category}</span>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: '#1F2937' }}>{art.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
