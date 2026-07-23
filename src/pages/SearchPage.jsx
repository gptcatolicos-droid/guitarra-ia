import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Music, Users, Search, X } from 'lucide-react';
import { useSEO } from '@/lib/seo';

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(128,185,64,0.15)', color: '#80B940' },
  'Intermedia': { bg: 'rgba(216,166,42,0.15)', color: '#D8A62A' },
  'Avanzada': { bg: 'rgba(217,90,50,0.15)', color: '#D95A32' },
};

function cleanTitle(title) {
  return (title || '').replace(/\s*\d+$/, '').trim();
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

  useSEO({
    title: query ? `Buscar: ${query} | Guitarra IA` : 'Buscar canciones | Guitarra IA',
    description: 'Busca canciones, artistas, acordes y tablaturas de guitarra en guitarraia.com.',
  });

  useEffect(() => {
    setInputVal(query);
    if (!query) { setSongs([]); setArtists([]); setPosts([]); return; }
    setLoading(true);
    Promise.all([
      base44.entities.Song.list('-created_date', 5000),
      base44.entities.Artist.list('-created_date', 5000),
      base44.entities.BlogPost.list('-created_date', 500),
    ])
      .then(([allSongs, allArtists, allPosts]) => {
        const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const nq = normalize(query);
        setSongs(allSongs.filter(s => normalize(s.title).includes(nq) || normalize(s.artist_name).includes(nq)));
        setArtists(allArtists.filter(a => normalize(a.name).includes(nq)));
        setPosts(allPosts.filter(p => p.published && [p.title, p.excerpt, p.content, p.category].some(value => normalize(value).includes(nq))));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputVal.trim()) navigate(`/buscar?q=${encodeURIComponent(inputVal.trim())}`);
  };

  const hasResults = songs.length > 0 || artists.length > 0 || posts.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E' }}>
      {/* Sticky search bar */}
      <div
        className="sticky top-0 z-10 px-4 py-3"
        style={{ backgroundColor: '#0E1112', borderBottom: '1px solid #272C2F' }}
      >
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#747B7F' }} />
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Buscar canciones, artistas, acordes…"
            autoFocus
            className="w-full max-w-full min-w-0 pl-11 pr-10 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#171A1C', border: '1px solid #303538', color: '#F4F4F2', caretColor: '#FF7200' }}
            onFocus={e => { e.target.style.borderColor = '#FF7200'; }}
            onBlur={e => { e.target.style.borderColor = '#303538'; }}
          />
          {inputVal && (
            <button type="button" onClick={() => { setInputVal(''); navigate('/buscar'); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full"
              style={{ color: '#747B7F' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!query && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: '#272C2F' }} />
            <p className="font-semibold mb-1" style={{ color: '#A7ACAE' }}>Busca cualquier canción o artista</p>
            <p className="text-sm" style={{ color: '#747B7F' }}>Escribe el nombre de la canción o el artista arriba</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#FF7200' }} />
          </div>
        )}

        {!loading && query && hasResults && (
          <div className="space-y-6">
            {artists.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" style={{ color: '#FF7200' }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#A7ACAE' }}>Artistas</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#181B1D', color: '#747B7F' }}>{artists.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {artists.map(a => (
                    <Link key={a.id} to={`/${a.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF7200'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgba(255,114,0,0.15)' }}>
                        <span className="text-sm font-bold" style={{ color: '#FF7200' }}>{a.name[0]}</span>
                      </div>
                      <span className="min-w-0 break-words text-sm font-medium" style={{ color: '#F4F4F2' }}>{a.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4" style={{ color: '#FF7200' }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#A7ACAE' }}>Artículos del blog</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#181B1D', color: '#747B7F' }}>{posts.length}</span>
                </div>
                <div className="space-y-1.5">
                  {posts.map(post => <Link key={post.id} to={`/blog/${post.slug}`} className="block px-4 py-3 rounded-xl transition-all" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}><p className="text-sm font-semibold" style={{ color: '#F4F4F2' }}>{post.title}</p><p className="text-xs mt-1 line-clamp-1" style={{ color: '#747B7F' }}>{post.excerpt || post.category}</p></Link>)}
                </div>
              </div>
            )}

            {songs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4" style={{ color: '#FF7200' }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#A7ACAE' }}>Canciones</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#181B1D', color: '#747B7F' }}>{songs.length}</span>
                </div>
                <div className="space-y-1.5">
                  {songs.map(s => {
                    const diff = DIFF_COLORS[s.difficulty];
                    return (
                      <Link key={s.id} to={`/${s.artist_slug}/${s.slug}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                        style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#444A4E'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: '#121516', border: '1px solid #272C2F' }}>
                          <Music className="w-4 h-4" style={{ color: '#444A4E' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{cleanTitle(s.title)}</p>
                          <p className="text-xs" style={{ color: '#747B7F' }}>{s.artist_name}</p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
                          {diff && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg, color: diff.color }}>
                              {s.difficulty}
                            </span>
                          )}
                          {s.has_chords && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,114,0,0.12)', color: '#FF7200' }}>
                              Acordes
                            </span>
                          )}
                          {s.has_tablature && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(79,158,216,0.12)', color: '#4F9ED8' }}>
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
            <Music className="w-12 h-12 mx-auto mb-4" style={{ color: '#272C2F' }} />
            <p className="font-semibold mb-1" style={{ color: '#A7ACAE' }}>No encontramos resultados</p>
            <p className="text-sm mb-4" style={{ color: '#747B7F' }}>para "{query}"</p>
            <Link to="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FF7200', color: '#fff' }}>
              Preguntar a GuitarraIA
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}