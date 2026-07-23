import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { TrendingUp, Music, ChevronRight, Star, BookOpen } from 'lucide-react';
import HeroSearchChat from '@/components/home/HeroSearchChat';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';
const HERO_BG = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/2fe719569_foto.png';

const QUICK_CHIPS = [
  'Canciones fáciles', 'Cuatro acordes', 'Rock en español', 'Baladas', 'Guitarra acústica', 'Para principiantes',
];

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(128,185,64,0.15)', color: '#80B940' },
  'Intermedia': { bg: 'rgba(216,166,42,0.15)', color: '#D8A62A' },
  'Avanzada': { bg: 'rgba(217,90,50,0.15)', color: '#D95A32' },
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
    <div className="flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
      {embedUrl ? (
        <iframe src={embedUrl} width="100%" height="152" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy" style={{ display: 'block', borderRadius: '10px 10px 0 0' }} />
      ) : (
        <div className="flex items-center justify-center" style={{ height: '152px', backgroundColor: '#121516' }}>
          <Music className="w-8 h-8" style={{ color: '#303538' }} />
        </div>
      )}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold line-clamp-1 mb-0.5" style={{ color: '#F4F4F2' }}>
            {song.title.replace(/\s*\d+$/, '').trim()}
          </p>
          <p className="text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {diff && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg, color: diff.color }}>
              {song.difficulty}
            </span>
          )}
          <Link to={`/${song.artist_slug}/${song.slug}`}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#FF7200', color: '#fff' }}>
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
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E' }}>

      {/* ===== HERO with background photo ===== */}
      <section
        className="relative px-4 lg:px-8 py-16 lg:py-24 overflow-hidden"
        style={{ borderBottom: '1px solid #272C2F' }}
      >
        {/* Background photo — desktop/tablet only, 85% dark overlay */}
        <div
          className="hidden md:block absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
          }}
        />
        <div className="hidden md:block absolute inset-0 z-0" style={{ backgroundColor: 'rgba(11,13,14,0.85)' }} />

        {/* Mobile: plain dark bg */}
        <div className="md:hidden absolute inset-0 z-0" style={{ backgroundColor: '#121516' }} />

        <div className="relative z-10 max-w-2xl mx-auto text-center w-full">
          <h1 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight" style={{ color: '#F4F4F2' }}>
            Toca tus canciones{' '}
            <span style={{ color: '#FF7200' }}>favoritas</span>
          </h1>
          <p className="text-base lg:text-lg mb-8" style={{ color: '#A7ACAE' }}>
            Acordes, tablaturas y herramientas para aprender, practicar y tocar mejor.
          </p>
          <HeroSearchChat quickChips={QUICK_CHIPS} />
        </div>
      </section>

      {/* ===== TRENDING ===== */}
      {topSongs.length > 0 && (
        <section className="px-4 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: '#FF7200' }} />
                <h2 className="text-xl font-bold" style={{ color: '#F4F4F2' }}>Canciones en tendencia</h2>
              </div>
              <Link to="/canciones" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#FF7200' }}>
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
                  style={{ backgroundColor: '#181B1D', border: '1px solid #303538', color: '#A7ACAE' }}>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div className="flex gap-1.5">
                  {topSongs.map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: i === carouselIndex ? '#FF7200' : '#303538' }} />
                  ))}
                </div>
                <button onClick={() => setCarouselIndex(i => (i + 1) % topSongs.length)}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: '#181B1D', border: '1px solid #303538', color: '#A7ACAE' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== CANCIONES (all with Spotify embed) ===== */}
      {allSpotifySongs.length > 3 && (
        <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #272C2F' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5" style={{ color: '#FF7200' }} />
                <h2 className="text-xl font-bold" style={{ color: '#F4F4F2' }}>Canciones</h2>
              </div>
              <Link to="/canciones" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#FF7200' }}>
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
        <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #272C2F' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" style={{ color: '#80B940' }} />
                <h2 className="text-xl font-bold" style={{ color: '#F4F4F2' }}>Canciones fáciles para empezar</h2>
              </div>
              <Link to="/canciones" className="flex items-center gap-1 text-sm font-medium" style={{ color: '#FF7200' }}>
                Ver más <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-1">
              {easySongs.map((song, i) => (
                <div key={song.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                >
                  <span className="text-sm font-bold w-5 text-right shrink-0" style={{ color: '#303538' }}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#121516', border: '1px solid #272C2F' }}>
                    <Music className="w-4 h-4" style={{ color: '#444A4E' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{song.title}</p>
                    <p className="text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline"
                      style={{ backgroundColor: 'rgba(128,185,64,0.15)', color: '#80B940' }}>
                      Fácil
                    </span>
                    <Link to={`/${song.artist_slug}/${song.slug}`}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                      style={{ backgroundColor: '#FF7200', color: '#fff' }}>
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
      <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #272C2F' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl px-6 py-5"
          style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
          <div>
            <p className="font-bold text-sm" style={{ color: '#F4F4F2' }}>¿Te gusta GuitarraIA? 💙</p>
            <p className="text-xs mt-0.5" style={{ color: '#747B7F' }}>Con 1 USD nos ayudas a mantener el sitio activo y seguir añadiendo canciones.</p>
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
              {blogPosts.map(art => (
                <Link key={art.id} to={`/blog/${art.slug}`}
                  className="flex items-start gap-3 p-4 rounded-xl transition-all"
                  style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#444A4E'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
                >
                  <BookOpen className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#FF7200' }} />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#747B7F' }}>{art.category}</span>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: '#F4F4F2' }}>{art.title}</p>
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