import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Music, Users } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import ChatInterface from '@/components/chat/ChatInterface';

function cleanTitle(title) {
  return (title || '').replace(/\s*\d+$/, '').trim();
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  useSEO({
    title: query ? `Buscar: ${query} | Tablaturas AI` : 'Buscar canciones | Tablaturas AI',
    description: 'Busca canciones, artistas, acordes y tablaturas de guitarra.',
    canonical: '/buscar',
  });

  useEffect(() => {
    if (!query) { setSongs([]); setArtists([]); return; }
    setLoading(true);
    Promise.all([
      base44.entities.Song.list('-created_date', 500),
      base44.entities.Artist.list('-created_date', 200),
    ])
      .then(([allSongs, allArtists]) => {
        const normalize = (s) =>
          (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const nq = normalize(query);
        setSongs(allSongs.filter((s) => normalize(s.title).includes(nq) || normalize(s.artist_name).includes(nq)));
        setArtists(allArtists.filter((a) => normalize(a.name).includes(nq)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  const hasResults = songs.length > 0 || artists.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Chat IA destacado */}
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="rounded-2xl overflow-hidden border-2 border-orange-400/40 shadow-lg shadow-orange-500/10"
          style={{ background: 'linear-gradient(135deg, #fff7f0 0%, #fff0fa 100%)' }}
        >
          <div className="flex flex-col" style={{ minHeight: '420px' }}>
            <ChatInterface embedded />
          </div>
        </div>
      </div>

      {/* Resultados de búsqueda si hay query */}
      {query && (
        <div className="px-6 lg:px-8 pb-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-foreground font-bold text-lg mb-4">
              Resultados para "{query}"
            </h2>

            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-border border-t-orange-500 rounded-full animate-spin" />
              </div>
            )}

            {!loading && hasResults && (
              <div className="space-y-6">
                {artists.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-orange-500" />
                      <h3 className="text-foreground font-semibold text-sm">Artistas</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {artists.map((a) => (
                        <Link
                          key={a.id}
                          to={`/${a.slug}`}
                          className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-orange-400 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center shrink-0">
                            <span className="text-white text-sm font-bold">{a.name[0]}</span>
                          </div>
                          <span className="text-foreground font-medium">{a.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {songs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Music className="w-4 h-4 text-orange-500" />
                      <h3 className="text-foreground font-semibold text-sm">Canciones</h3>
                    </div>
                    <div className="space-y-2">
                      {songs.map((s) => (
                        <Link
                          key={s.id}
                          to={`/${s.artist_slug}/${s.slug}`}
                          className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-orange-400 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-foreground font-medium truncate">{cleanTitle(s.title)}</p>
                            <p className="text-muted-foreground text-xs">{s.artist_name}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {s.has_chords && <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">Acordes</span>}
                            {s.has_tablature && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs rounded font-medium">Tab</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && query && !hasResults && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No se encontraron resultados para "{query}".</p>
                <p className="text-muted-foreground text-sm mt-1">Prueba preguntarle directamente a la IA arriba.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}