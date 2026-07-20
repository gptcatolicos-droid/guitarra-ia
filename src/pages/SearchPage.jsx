import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  useSEO({
    title: query
      ? `Buscar: ${query} | Tablaturas AI`
      : 'Buscar canciones | Tablaturas AI',
    description: 'Busca canciones, artistas, acordes y tablaturas de guitarra.',
    canonical: '/buscar',
  });

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setSongs([]);
      setArtists([]);
      return;
    }
    setLoading(true);
    Promise.all([
      base44.entities.Song.list('-created_date', 500),
      base44.entities.Artist.list('-created_date', 200),
    ])
      .then(([allSongs, allArtists]) => {
        const normalize = (s) =>
          (s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        const nq = normalize(query);
        setSongs(
          allSongs.filter(
            (s) =>
              normalize(s.title).includes(nq) ||
              normalize(s.artist_name).includes(nq)
          )
        );
        setArtists(allArtists.filter((a) => normalize(a.name).includes(nq)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: input });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a7afb8]" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar canciones, artistas o acordes..."
            autoFocus
            className="w-full bg-[#20242a] border border-[#2b3138] rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#a7afb8] focus:border-[#ff7a00] outline-none transition-colors"
          />
        </div>
      </form>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#2b3138] border-t-[#ff7a00] rounded-full animate-spin" />
        </div>
      )}

      {!loading && query && (
        <div className="space-y-6">
          {artists.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-2">Artistas</h2>
              <div className="space-y-2">
                {artists.map((a) => (
                  <Link
                    key={a.id}
                    to={`/${a.slug}`}
                    className="block bg-[#20242a] border border-[#2b3138] rounded-xl p-3 hover:border-[#ff7a00] transition-colors"
                  >
                    <span className="text-white">{a.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {songs.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-2">Canciones</h2>
              <div className="space-y-2">
                {songs.map((s) => (
                  <Link
                    key={s.id}
                    to={`/${s.artist_slug}/${s.slug}`}
                    className="block bg-[#20242a] border border-[#2b3138] rounded-xl p-3 hover:border-[#ff7a00] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-white font-medium">{s.title}</span>
                        <span className="text-[#a7afb8] text-sm ml-2">
                          {s.artist_name}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {s.has_chords && (
                          <span className="px-2 py-0.5 bg-[#ff7a00]/10 text-[#ff7a00] text-xs rounded">
                            A
                          </span>
                        )}
                        {s.has_tablature && (
                          <span className="px-2 py-0.5 bg-[#ff7a00]/10 text-[#ff7a00] text-xs rounded">
                            T
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {artists.length === 0 && songs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#a7afb8] mb-2">
                No se encontraron resultados para "{query}".
              </p>
              <p className="text-[#a7afb8] text-sm">
                Verifica la ortografía o intenta con otro término.
              </p>
            </div>
          )}
        </div>
      )}

      {!query && !loading && (
        <p className="text-[#a7afb8] text-center py-12">
          Escribe para buscar canciones, artistas o acordes.
        </p>
      )}
    </div>
  );
}