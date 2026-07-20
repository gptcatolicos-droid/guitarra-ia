import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { ArrowLeft, Heart, Share2, MoreHorizontal } from 'lucide-react';
import ChordViewer from '@/components/ChordViewer';
import TablatureViewer from '@/components/TablatureViewer';
import SongMeta from '@/components/SongMeta';

export default function SongPage() {
  const { artistSlug, songSlug, view } = useParams();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: song
      ? `${song.title} - ${song.artist_name} | Acordes y Tablatura | Tablaturas AI`
      : 'Cargando canción... | Tablaturas AI',
    description: song
      ? `Acordes y tablatura de ${song.title} de ${song.artist_name}. Tonalidad: ${song.original_key || 'N/A'}. Aprende a tocarla en guitarra.`
      : '',
    canonical: `/${artistSlug}/${songSlug}`,
    jsonLd: song
      ? {
          '@context': 'https://schema.org',
          '@type': 'MusicComposition',
          name: song.title,
          composer: { '@type': 'Person', name: song.artist_name },
          inLanguage: 'es',
          url: `/${artistSlug}/${songSlug}`,
        }
      : null,
  });

  useEffect(() => {
    if (!artistSlug || !songSlug) return;
    setLoading(true);
    base44.entities.Song
      .filter({ artist_slug: artistSlug, slug: songSlug }, '-created_date', 1)
      .then((songs) => {
        if (songs && songs.length > 0) {
          setSong(songs[0]);
          base44.entities.Song
            .update(songs[0].id, { views: (songs[0].views || 0) + 1 })
            .catch(() => {});
          const recents = JSON.parse(localStorage.getItem('recents') || '[]');
          const entry = {
            id: songs[0].id,
            title: songs[0].title,
            artist_name: songs[0].artist_name,
            artist_slug: artistSlug,
            slug: songSlug,
          };
          const filtered = recents.filter((r) => r.id !== entry.id);
          localStorage.setItem('recents', JSON.stringify([entry, ...filtered].slice(0, 20)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistSlug, songSlug]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] lg:h-screen">
        <div className="w-8 h-8 border-4 border-[#2b3138] border-t-[#ff7a00] rounded-full animate-spin" />
      </div>
    );

  if (!song)
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] lg:h-screen p-8">
        <p className="text-[#a7afb8]">No se encontró la canción.</p>
        <Link to="/" className="mt-4 text-[#ff7a00] hover:underline">
          Volver al inicio
        </Link>
      </div>
    );

  const isTransposed = view && view.startsWith('tono-');
  const transposeKey = isTransposed ? view.replace('tono-', '') : null;
  const activeView = view || (song.has_tablature ? 'tablatura' : 'acordes');

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const entry = {
      id: song.id,
      title: song.title,
      artist_name: song.artist_name,
      artist_slug: artistSlug,
      slug: songSlug,
    };
    const exists = favorites.find((f) => f.id === song.id);
    if (exists) {
      localStorage.setItem('favorites', JSON.stringify(favorites.filter((f) => f.id !== song.id)));
    } else {
      localStorage.setItem('favorites', JSON.stringify([entry, ...favorites]));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8">
      <div className="mb-6">
        <Link
          to={`/${artistSlug}`}
          className="inline-flex items-center text-[#a7afb8] hover:text-white text-sm mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {song.artist_name}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">
              {song.title}
            </h1>
            <p className="text-[#a7afb8] mt-1">{song.artist_name}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleFavorite}
              className="p-2 text-[#a7afb8] hover:text-[#ff7a00] transition-colors"
              title="Guardar en favoritos"
            >
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 text-[#a7afb8] hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-[#a7afb8] hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <SongMeta song={song} />

      {(song.has_chords || song.has_tablature) && (
        <div className="flex items-center gap-1 mb-6 border-b border-[#2b3138]">
          {song.has_chords && (
            <Link
              to={`/${artistSlug}/${songSlug}/acordes`}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'acordes' || isTransposed
                  ? 'border-[#ff7a00] text-[#ff7a00]'
                  : 'border-transparent text-[#a7afb8] hover:text-white'
              }`}
            >
              Acordes
            </Link>
          )}
          {song.has_tablature && (
            <Link
              to={`/${artistSlug}/${songSlug}/tablatura`}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'tablatura'
                  ? 'border-[#ff7a00] text-[#ff7a00]'
                  : 'border-transparent text-[#a7afb8] hover:text-white'
              }`}
            >
              Tablatura
            </Link>
          )}
        </div>
      )}

      {(activeView === 'acordes' || isTransposed) && song.has_chords && (
        <ChordViewer song={song} transposeKey={transposeKey} />
      )}
      {activeView === 'tablatura' && song.has_tablature && (
        <TablatureViewer song={song} />
      )}
      {activeView === 'acordes' && !song.has_chords && song.has_tablature && (
        <TablatureViewer song={song} />
      )}
    </div>
  );
}