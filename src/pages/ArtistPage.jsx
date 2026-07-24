import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { Music, ChevronLeft } from 'lucide-react';

export default function ArtistPage() {
  const { artistSlug } = useParams();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: artist ? `${artist.name} — Acordes y Tablaturas | Guitarra IA` : 'Artista | Guitarra IA',
    description: artist ? `Canciones de ${artist.name} con acordes y tablaturas de guitarra en guitarraia.com.` : '',
    canonical: `https://www.guitarraia.com/${artistSlug}`,
    jsonLd: artist ? {
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      name: artist.name,
    } : null,
  });

  useEffect(() => {
    if (!artistSlug) return;
    setLoading(true);
    Promise.all([
      base44.entities.Artist.filter({ slug: artistSlug }, '-created_date', 1),
      base44.entities.Song.filter({ artist_slug: artistSlug }, 'title', 500),
    ])
      .then(([artists, songsData]) => {
        setArtist(artists?.[0] || null);
        setSongs(songsData || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 bg-g-page">
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#F97316' }} />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 bg-g-page">
        <p style={{ color: '#6B7280' }}>Artista no encontrado.</p>
        <Link to="/" className="mt-4" style={{ color: '#F97316' }}>Volver al inicio</Link>
      </div>
    );
  }

  // Consolidate duplicate versions
  const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\d+$/, '').trim();
  const seen = new Map();
  for (const song of songs) {
    const key = normalize(song.title);
    if (!seen.has(key)) {
      seen.set(key, { ...song, title: song.title.replace(/\s*\d+$/, '').trim() });
    } else {
      const ex = seen.get(key);
      if (song.has_chords) ex.has_chords = true;
      if (song.has_tablature) ex.has_tablature = true;
    }
  }
  const uniqueSongs = Array.from(seen.values());

  return (
    <div className="min-h-screen bg-g-page">
      <div className="artist-page-container">
        <Link to="/artistas" className="flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: '#6B7280' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; }}>
          <ChevronLeft className="w-4 h-4" /> Artistas
        </Link>

        {/* Artist header */}
        <div className="artist-page-header flex items-center gap-5 mb-8 pb-6 min-w-0" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)' }}
          >
            <span className="text-white text-2xl font-bold">{artist.name[0]}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold break-words" style={{ color: '#1F2937' }}>{artist.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
              {uniqueSongs.length} {uniqueSongs.length === 1 ? 'canción disponible' : 'canciones disponibles'}
            </p>
          </div>
        </div>

        {/* Songs list */}
        {uniqueSongs.length > 0 ? (
          <div className="artist-song-list space-y-1.5">
            {uniqueSongs.map(song => (
              <Link key={song.id} to={`/${artistSlug}/${song.slug}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-white shadow-sm"
                style={{ border: '1px solid #E5E7EB' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#F97316'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                  <Music className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>{song.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {song.original_key && <span className="text-xs" style={{ color: '#6B7280' }}>Tonalidad: {song.original_key}</span>}
                    {song.difficulty && <span className="text-xs" style={{ color: '#6B7280' }}>· {song.difficulty}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
                  {song.has_chords && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FED7AA', color: '#EA580C' }}>
                      Acordes
                    </span>
                  )}
                  {song.has_tablature && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                      Tab
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center py-12" style={{ color: '#6B7280' }}>
            No hay canciones disponibles para este artista.
          </p>
        )}
      </div>
    </div>
  );
}