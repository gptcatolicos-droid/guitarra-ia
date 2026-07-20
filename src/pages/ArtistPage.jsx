import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { Music } from 'lucide-react';

export default function ArtistPage() {
  const { artistSlug } = useParams();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: artist
      ? `${artist.name} - Canciones, Acordes y Tablaturas | Tablaturas AI`
      : 'Cargando... | Tablaturas AI',
    description: artist
      ? `Canciones de ${artist.name} con acordes y tablaturas de guitarra.`
      : '',
    canonical: `/${artistSlug}`,
    jsonLd: artist
      ? {
          '@context': 'https://schema.org',
          '@type': 'MusicGroup',
          name: artist.name,
          genre: 'Música',
        }
      : null,
  });

  useEffect(() => {
    if (!artistSlug) return;
    setLoading(true);
    Promise.all([
      base44.entities.Artist.filter({ slug: artistSlug }, '-created_date', 1),
      base44.entities.Song.filter({ artist_slug: artistSlug }, 'title', 500),
    ])
      .then(([artists, songsData]) => {
        setArtist((artists && artists[0]) || null);
        setSongs(songsData || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistSlug]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] lg:h-screen">
        <div className="w-8 h-8 border-4 border-[#2b3138] border-t-[#ff7a00] rounded-full animate-spin" />
      </div>
    );

  if (!artist)
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] lg:h-screen p-8">
        <p className="text-[#a7afb8]">Artista no encontrado.</p>
        <Link to="/" className="mt-4 text-[#ff7a00] hover:underline">
          Volver al inicio
        </Link>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#c54e00] flex items-center justify-center shrink-0">
          <Music className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">{artist.name}</h1>
          <p className="text-[#a7afb8] mt-1">
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'} disponible
            {songs.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {songs.length > 0 ? (
        <div className="space-y-2">
          {(() => {
            // Consolidate duplicate versions (same normalized title) into one entry
            const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\d+$/, '').trim();
            const seen = new Map();
            for (const song of songs) {
              const key = normalize(song.title);
              if (!seen.has(key)) {
                seen.set(key, { ...song, title: song.title.replace(/\s*\d+$/, '').trim() });
              } else {
                const existing = seen.get(key);
                if (song.has_chords) existing.has_chords = true;
                if (song.has_tablature) existing.has_tablature = true;
                if (song.original_key && !existing.original_key) existing.original_key = song.original_key;
              }
            }
            return Array.from(seen.values()).map((song) => (
              <Link
                key={song.id}
                to={`/${artistSlug}/${song.slug}`}
                className="block bg-[#20242a] border border-[#2b3138] rounded-xl p-4 hover:border-[#ff7a00] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-white font-medium truncate">{song.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#a7afb8]">
                      {song.original_key && <span>Tonalidad: {song.original_key}</span>}
                      {song.difficulty && <span>· {song.difficulty}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {song.has_chords && (
                      <span className="px-2 py-0.5 bg-[#ff7a00]/10 text-[#ff7a00] text-xs rounded">
                        Acordes
                      </span>
                    )}
                    {song.has_tablature && (
                      <span className="px-2 py-0.5 bg-[#ff7a00]/10 text-[#ff7a00] text-xs rounded">
                        Tab
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ));
          })()}
        </div>
      ) : (
        <p className="text-[#a7afb8] text-center py-8">
          No hay canciones disponibles para este artista.
        </p>
      )}
    </div>
  );
}