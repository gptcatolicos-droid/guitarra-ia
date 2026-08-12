import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Music, Users, Search, X } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import ArtistAvatar from '@/components/ArtistAvatar';

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(76,154,42,0.12)', color: '#4C9A2A' },
  'Intermedia': { bg: 'rgba(183,121,31,0.12)', color: '#B7791F' },
  'Avanzada': { bg: 'rgba(194,65,12,0.12)', color: '#C2410C' },
};

const SEARCH_SONG_FIELDS = [
  'id', 'title', 'slug', 'artist_name', 'artist_slug', 'artist_image',
  'difficulty', 'has_chords', 'has_tablature', 'views', 'created_date',
];
const SEARCH_ARTIST_FIELDS = ['id', 'name', 'slug', 'image', 'spotify_image_url', 'created_date'];
const SEARCH_POST_FIELDS = ['id', 'title', 'slug', 'excerpt', 'category', 'published', 'created_date'];

function cleanTitle(title) {
  return (title || '').replace(/\s*\d+$/, '').trim();
}

function normalize(value) {
  return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slugify(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueBy(items, keyFor) {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = keyFor(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(query);
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleSongCount, setVisibleSongCount] = useState(12);
  const loadMoreRef = useRef(null);

  useSEO({
    title: query ? `Buscar: ${query} | Guitarra IA` : 'Buscar canciones | Guitarra IA',
    description: 'Busca canciones, artistas, acordes y tablaturas de guitarra en guitarraia.com.',
  });

  useEffect(() => {
    let cancelled = false;
    let idleId;
    setInputVal(query);
    setVisibleSongCount(12);
    if (!query) {
      setSongs([]); setArtists([]); setPosts([]); setLoading(false); setLoadingMore(false);
      return undefined;
    }

    setLoading(true);
    setLoadingMore(true);
    const querySlug = slugify(query);

    // Phase 1: exact song/artist candidates. An exact artist also gets its
    // first three songs immediately, before the broader catalog scan.
    Promise.all([
      base44.entities.Song.filter({ slug: querySlug }, '-views', 3, 0, SEARCH_SONG_FIELDS),
      base44.entities.Song.filter({ title: query }, '-views', 3, 0, SEARCH_SONG_FIELDS),
      base44.entities.Artist.filter({ slug: querySlug }, '-created_date', 3, 0, SEARCH_ARTIST_FIELDS),
      base44.entities.Artist.filter({ name: query }, '-created_date', 3, 0, SEARCH_ARTIST_FIELDS),
    ]).then(async ([bySlug, byTitle, artistsBySlug, artistsByName]) => {
      if (cancelled) return;
      const exactArtists = uniqueBy([...(artistsBySlug || []), ...(artistsByName || [])], (a) => a.id);
      const exactArtist = exactArtists[0];
      const artistSongs = exactArtist
        ? await base44.entities.Song.filter({ artist_slug: exactArtist.slug }, '-views', 3, 0, SEARCH_SONG_FIELDS)
        : [];
      if (cancelled) return;
      setArtists(exactArtists);
      setSongs(uniqueBy([...(bySlug || []), ...(byTitle || []), ...(artistSongs || [])], (s) => s.id));
      setLoading(false);

      const loadBackground = () => Promise.all([
        base44.entities.Song.list('-views', 5000, 0, SEARCH_SONG_FIELDS),
        base44.entities.Artist.list('-created_date', 5000, 0, SEARCH_ARTIST_FIELDS),
        base44.entities.BlogPost.list('-created_date', 500, 0, SEARCH_POST_FIELDS),
      ]).then(([allSongs, allArtists, allPosts]) => {
        if (cancelled) return;
        const nq = normalize(query);
        const matchingSongs = allSongs.filter((song) => normalize(song.title).includes(nq) || normalize(song.artist_name).includes(nq));
        const matchingArtists = allArtists.filter((artist) => normalize(artist.name).includes(nq));
        const matchingPosts = allPosts.filter((post) => post.published && [post.title, post.excerpt, post.category].some((value) => normalize(value).includes(nq)));
        setSongs((current) => uniqueBy([...current, ...matchingSongs], (song) => song.id));
        setArtists((current) => uniqueBy([...current, ...matchingArtists], (artist) => artist.id));
        setPosts(matchingPosts);
      }).catch(() => {}).finally(() => { if (!cancelled) setLoadingMore(false); });

      idleId = 'requestIdleCallback' in window
        ? window.requestIdleCallback(loadBackground, { timeout: 900 })
        : window.setTimeout(loadBackground, 250);
    }).catch(() => {
      if (!cancelled) { setLoading(false); setLoadingMore(false); }
    });

    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [query]);

  useEffect(() => {
    if (!loadMoreRef.current || visibleSongCount >= songs.length) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleSongCount((count) => Math.min(count + 20, songs.length));
    }, { rootMargin: '500px 0px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [songs.length, visibleSongCount]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputVal.trim()) navigate(`/buscar?q=${encodeURIComponent(inputVal.trim())}`);
  };

  const hasResults = songs.length > 0 || artists.length > 0 || posts.length > 0;

  return (
    <div className="min-h-screen bg-g-page">
      {/* Sticky search bar */}
      <div
        className="sticky top-0 z-10 px-4 py-3 bg-white"
        style={{ borderBottom: '1px solid #E5E7EB' }}
      >
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Buscar canciones, artistas, acordes…"
            autoFocus
            className="w-full max-w-full min-w-0 pl-11 pr-10 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1F2937', caretColor: '#F97316' }}
            onFocus={e => { e.target.style.borderColor = '#F97316'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
          />
          {inputVal && (
            <button type="button" onClick={() => { setInputVal(''); navigate('/buscar'); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full"
              style={{ color: '#9CA3AF' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!query && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
            <p className="font-semibold mb-1" style={{ color: '#1F2937' }}>Busca cualquier canción o artista</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>Escribe el nombre de la canción o el artista arriba</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#F97316' }} />
          </div>
        )}

        {!loading && query && hasResults && (
          <div className="space-y-6">
            {artists.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" style={{ color: '#F97316' }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#1F2937' }}>Artistas</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>{artists.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {artists.map(a => (
                    <Link key={a.id} to={`/${a.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all bg-white shadow-sm"
                      style={{ border: '1px solid #E5E7EB' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#F97316'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                    >
                      <ArtistAvatar artist={a} className="w-9 h-9" />
                      <span className="min-w-0 break-words text-sm font-medium" style={{ color: '#1F2937' }}>{a.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4" style={{ color: '#F97316' }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#1F2937' }}>Artículos del blog</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>{posts.length}</span>
                </div>
                <div className="space-y-1.5">
                  {posts.map(post => <Link key={post.id} to={`/blog/${post.slug}`} className="block px-4 py-3 rounded-xl transition-all bg-white shadow-sm" style={{ border: '1px solid #E5E7EB' }}><p className="text-sm font-semibold" style={{ color: '#1F2937' }}>{post.title}</p><p className="text-xs mt-1 line-clamp-1" style={{ color: '#6B7280' }}>{post.excerpt || post.category}</p></Link>)}
                </div>
              </div>
            )}

            {songs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4" style={{ color: '#F97316' }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#1F2937' }}>Canciones</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>{songs.length}</span>
                </div>
                <div className="space-y-1.5">
                  {songs.map(s => {
                    const diff = DIFF_COLORS[s.difficulty];
                    return (
                      <Link key={s.id} to={`/${s.artist_slug}/${s.slug}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-white shadow-sm"
                        style={{ border: '1px solid #E5E7EB' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                      >
                        <ArtistAvatar song={s} className="w-9 h-9" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>{cleanTitle(s.title)}</p>
                          <p className="text-xs" style={{ color: '#6B7280' }}>{s.artist_name}</p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
                          {diff && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg, color: diff.color }}>
                              {s.difficulty}
                            </span>
                          )}
                          {s.has_chords && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FED7AA', color: '#EA580C' }}>
                              Acordes
                            </span>
                          )}
                          {s.has_tablature && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                              Tab
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && query && !hasResults && (
          <div className="text-center py-16">
            <Music className="w-12 h-12 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
            <p className="font-semibold mb-1" style={{ color: '#1F2937' }}>No encontramos resultados</p>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>para "{query}"</p>
            <Link to="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)' }}>
              Preguntar a GuitarraIA
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
