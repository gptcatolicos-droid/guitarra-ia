import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { TrendingUp, Music, ChevronRight, ChevronDown, ChevronUp, Star, BookOpen, Radio, Guitar, PlayCircle, Sparkles, Youtube } from 'lucide-react';
import HeroSearchChat from '@/components/home/HeroSearchChat';
import ArtistAvatar from '@/components/ArtistAvatar';
import SpotifyEmbed from '@/components/SpotifyEmbed';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

const QUICK_CHIPS = [
  'Canciones fáciles', 'Cuatro acordes', 'Rock en español', 'Baladas', 'Guitarra acústica', 'Para principiantes',
];

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(76,154,42,0.12)', color: '#4C9A2A' },
  'Intermedia': { bg: 'rgba(183,121,31,0.12)', color: '#B7791F' },
  'Avanzada': { bg: 'rgba(194,65,12,0.12)', color: '#C2410C' },
};

function shuffleSongs(songs) {
  const shuffled = [...songs];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function orderTrendingSongs(songs, randomMode) {
  const ordered = [...songs].sort((a, b) => {
    const aOrder = Number.isFinite(a.trending_order) ? a.trending_order : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(b.trending_order) ? b.trending_order : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.views || 0) - (a.views || 0);
  });
  return randomMode ? shuffleSongs(ordered) : ordered;
}

function hasSpotifyPlayer(song) {
  return Boolean(song.spotify_embed || song.spotify_embed_url || (song.spotify_match_status === 'matched' && song.spotify_track_id));
}

function SpotifySongCard({ song }) {
  const diff = DIFF_COLORS[song.difficulty];
  const embedSource = song.spotify_embed || song.spotify_embed_url;

  return (
    <div className="spotify-card flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {embedSource ? (
        <div className="spotify-embed-wrapper">
          <SpotifyEmbed source={embedSource} height={152} title={`Spotify: ${song.title}`} />
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ height: '152px', backgroundColor: '#F3F4F6' }}>
          <Music className="w-8 h-8" style={{ color: '#D1D5DB' }} />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 min-w-0">
        <div className="min-w-0 flex items-center gap-2">
          <ArtistAvatar song={song} className="w-8 h-8" />
          <div className="min-w-0">
          <p className="text-sm font-semibold mb-0.5 break-words" style={{ color: '#1F2937' }}>
            {song.title.replace(/\s*\d+$/, '').trim()}
          </p>
          <p className="text-xs break-words" style={{ color: '#6B7280' }}>{song.artist_name}</p>
          </div>
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
  const [heroSongs, setHeroSongs] = useState([]);
  const [practiceSongs, setPracticeSongs] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [allSpotifySongs, setAllSpotifySongs] = useState([]);
  const [trendingRandom, setTrendingRandom] = useState(false);
  const [easySongs, setEasySongs] = useState([]);
  const [unpluggedSongs, setUnpluggedSongs] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [practiceExpanded, setPracticeExpanded] = useState(false);
  const [unpluggedExpanded, setUnpluggedExpanded] = useState(false);

  useSEO({
    title: 'Guitarra IA — Acordes, tablaturas y asistente IA | guitarraia.com',
    description: 'Busca acordes, tablaturas y cifrados de guitarra con inteligencia artificial.',
    image: LOGO_URL,
    canonical: 'https://guitarraia.com/',
  });

  useEffect(() => {
    const loadHomeSongs = async () => {
      try {
        // Hero and trends have their own admin flags. They must never depend
        // on global view count, otherwise configured records can disappear.
        const [hero, trends, popular] = await Promise.all([
          base44.entities.Song.filter({ is_hero: true }, '-views', 3),
          base44.entities.Song.filter({ is_trending: true }, '-views', 100),
          base44.entities.Song.list('-views', 200),
        ]);
        const randomMode = localStorage.getItem('trendingRandom') === 'true';
        const selectedHero = (hero || []).slice(0, 3);
        const selectedTrends = orderTrendingSongs(trends || [], randomMode);
        const selectedIds = new Set([...selectedHero, ...selectedTrends].map((song) => song.id));
        const withSpotify = (popular || [])
          .filter((song) => (song.spotify_embed || song.spotify_embed_url) && !selectedIds.has(song.id))
          .slice(0, 9);

        setHeroSongs(selectedHero);
        setTrendingSongs(selectedTrends);
        setTrendingRandom(randomMode);
        setAllSpotifySongs(withSpotify);
      } catch {}
    };

    loadHomeSongs();
    // This section is editorially curated in Admin; difficulty alone must
    // never override the administrator's selection.
    base44.entities.Song.filter({ youtube_practice_enabled: true, youtube_analysis_status: 'ready' }, '-youtube_analysis_updated_at', 6)
      .then(setPracticeSongs).catch(() => {});
    base44.entities.Song.filter({ is_easy_pick: true }, '-views', 6)
      .then(setEasySongs).catch(() => {});
    base44.entities.Song.filter({ is_unplugged: true }, '-views', 3)
      .then((items) => setUnpluggedSongs((items || []).filter(hasSpotifyPlayer))).catch(() => {});
    base44.entities.BlogPost.filter({ published: true }, '-created_date', 3)
      .then(setBlogPosts).catch(() => {});
  }, []);

  useEffect(() => {
    setCarouselIndex((index) => Math.min(index, Math.max(trendingSongs.length - 1, 0)));
  }, [trendingSongs.length]);

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
            Afinación precisa, acordes al instante y canciones que suenan como quieres.
          </p>
          <HeroSearchChat quickChips={QUICK_CHIPS} />
          <Link to="/afinador" className="tuner-promo"><span><Radio className="w-5 h-5" /></span><div><b>Afinador IA</b><small>Afinación precisa con IA en tiempo real.</small></div><em>Abrir afinador</em></Link>
        </div>
      </section>

      {/* ===== UNPLUGGED PLAYLIST ===== */}
      {unpluggedSongs.length > 0 && (
        <section className="px-4 lg:px-8 py-10" style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8F9FB 100%)', borderBottom: '1px solid #FDE8D4' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFF1E0', color: '#F97316' }}><Guitar className="w-5 h-5" /></span>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.14em]" style={{ color: '#F97316' }}>PLAYLIST GUITARRAIA</p>
                  <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>Unplugged</h2>
                </div>
              </div>
              <Link to="/unplugged" className="flex shrink-0 items-center gap-1 text-sm font-medium" style={{ color: '#F97316' }}>
                Ver playlist <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>Canciones escogidas para tocar desde la guitarra: cercanas, acústicas y sin adornos.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {unpluggedSongs.map((song, index) => (
                <div key={song.id} className={index > 0 && !unpluggedExpanded ? 'hidden sm:block' : ''}>
                  <SpotifySongCard song={song} />
                </div>
              ))}
            </div>
            {unpluggedSongs.length > 1 && (
              <button type="button" onClick={() => setUnpluggedExpanded((value) => !value)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border bg-white text-sm font-bold sm:hidden" style={{ borderColor: '#FDBA74', color: '#C2410C' }}>
                {unpluggedExpanded ? <><ChevronUp className="h-4 w-4" /> Mostrar menos</> : <><ChevronDown className="h-4 w-4" /> Ver {unpluggedSongs.length - 1} canciones más</>}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ===== PRACTICE WITH IA ===== */}
      {practiceSongs.length > 0 && (
        <section className="relative overflow-hidden px-4 py-10 lg:px-8 lg:py-14" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 48%, #FFEDD5 100%)', borderBottom: '1px solid #FED7AA' }}>
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(251,146,60,.20)' }} />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]" style={{ background: '#FFF1E0', color: '#C2410C' }}><Sparkles className="h-4 w-4" /> Nueva experiencia</span>
                <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl" style={{ color: '#1F2937' }}>Practica con YouTube y mira cada acorde <span style={{ color: '#F97316' }}>en el momento exacto.</span></h2>
                <p className="mt-2 text-sm sm:text-base" style={{ color: '#6B7280' }}>Canciones seleccionadas con letra del acorde, figura y cambios sincronizados.</p>
              </div>
              <Link to="/practicar" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white" style={{ background: 'linear-gradient(135deg, #FB923C, #F97316)', boxShadow: '0 8px 20px rgba(249,115,22,.22)' }}>
                Ver todas las prácticas <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {practiceSongs.slice(0, 6).map((song, index) => (
                <Link key={song.id} to={`/${song.artist_slug}/${song.slug}/practicar`} className={`${index > 0 && !practiceExpanded ? 'hidden sm:block' : ''} group overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`} style={{ borderColor: '#FED7AA' }}>
                  <div className="relative aspect-[16/9] overflow-hidden bg-orange-50">
                    {song.youtube_video_id ? <img src={`https://i.ytimg.com/vi/${song.youtube_video_id}/hqdefault.jpg`} alt={song.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Guitar className="h-10 w-10" style={{ color: '#FDBA74' }} /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white"><Youtube className="h-3.5 w-3.5" /> SINCRONIZADA</span>
                    <div className="absolute bottom-3 left-3 right-3 text-white"><p className="truncate text-base font-black">{song.title.replace(/\s*\d+$/, '').trim()}</p><p className="truncate text-xs text-white/80">{song.artist_name}</p></div>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4"><div className="flex flex-wrap gap-1.5 text-[10px] font-bold">{song.original_key && <span className="rounded-full px-2 py-1" style={{ background: '#FFF7ED', color: '#C2410C' }}>Tono {song.original_key}</span>}{song.difficulty && <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">{song.difficulty}</span>}</div><span className="inline-flex shrink-0 items-center gap-1 text-xs font-black" style={{ color: '#EA580C' }}><PlayCircle className="h-4 w-4" /> Practicar</span></div>
                </Link>
              ))}
            </div>
            {practiceSongs.length > 1 && (
              <button type="button" onClick={() => setPracticeExpanded((value) => !value)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border bg-white text-sm font-bold sm:hidden" style={{ borderColor: '#FDBA74', color: '#C2410C' }}>
                {practiceExpanded ? <><ChevronUp className="h-4 w-4" /> Mostrar menos</> : <><ChevronDown className="h-4 w-4" /> Ver {Math.min(practiceSongs.length, 6) - 1} prácticas más</>}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ===== HERO SELECTION ===== */}
      {heroSongs.length > 0 && (
        <section className="px-4 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-5 min-w-0">
              <Star className="w-5 h-5 shrink-0" style={{ color: '#F97316' }} />
              <h2 className="text-xl font-bold break-words" style={{ color: '#1F2937' }}>
                Destacadas en <span style={{ color: '#1F2937' }}>Guitarra</span><span style={{ color: '#F97316' }}>IA</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {heroSongs.map(song => <SpotifySongCard key={song.id} song={song} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== TRENDING ===== */}
      {trendingSongs.length > 0 && (
        <section className="px-4 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="w-5 h-5 shrink-0" style={{ color: '#F97316' }} />
                <div>
                  <h2 className="text-xl font-bold break-words" style={{ color: '#1F2937' }}>Canciones en tendencia</h2>
                  {trendingRandom && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Selección aleatoria</p>}
                </div>
              </div>
              <Link to="/canciones" className="flex shrink-0 items-center gap-1 text-sm font-medium" style={{ color: '#F97316' }}>
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Desktop: 3 col grid */}
            <div className="hidden sm:grid grid-cols-3 gap-4">
              {trendingSongs.slice(0, 3).map(song => <SpotifySongCard key={song.id} song={song} />)}
            </div>
            {/* Mobile: carousel */}
            <div className="sm:hidden">
              <SpotifySongCard song={trendingSongs[carouselIndex]} />
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => setCarouselIndex(i => (i - 1 + trendingSongs.length) % trendingSongs.length)}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div className="flex gap-1.5">
                  {trendingSongs.map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: i === carouselIndex ? '#F97316' : '#D1D5DB' }} />
                  ))}
                </div>
                <button onClick={() => setCarouselIndex(i => (i + 1) % trendingSongs.length)}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== POPULAR SONGS ===== */}
      {allSpotifySongs.length > 0 && (
        <section className="px-4 lg:px-8 py-8" style={{ borderTop: '1px solid #E5E7EB' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5" style={{ color: '#F97316' }} />
                <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>Más vistas en Guitarra IA</h2>
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
                  <ArtistAvatar song={song} className="w-10 h-10" imageClassName="border border-orange-100" />
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
