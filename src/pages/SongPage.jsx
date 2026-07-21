import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { ArrowLeft, Heart, Share2, Sparkles } from 'lucide-react';
import ChordViewer from '@/components/ChordViewer';
import TablatureViewer from '@/components/TablatureViewer';
import SongMeta from '@/components/SongMeta';
import SpotifyPlayer from '@/components/SpotifyPlayer';

export default function SongPage() {
  const { artistSlug, songSlug, view } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  const displayTitle = song
    ? song.title.replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '').replace(/\s*\d+$/, '').trim()
    : '';

  useSEO({
    title: song
      ? `${displayTitle} - ${song.artist_name} | Acordes y Tablatura | Tablaturas AI`
      : 'Cargando canción... | Tablaturas AI',
    description: song
      ? `Acordes y tablatura de ${displayTitle} de ${song.artist_name}. Tonalidad: ${song.original_key || 'N/A'}. Aprende a tocarla en guitarra.`
      : '',
    canonical: `/${artistSlug}/${songSlug}`,
  });

  useEffect(() => {
    if (!artistSlug || !songSlug) return;
    setLoading(true);
    base44.entities.Song
      .filter({ artist_slug: artistSlug, slug: songSlug }, '-created_date', 1)
      .then((songs) => {
        if (songs && songs.length > 0) {
          setSong(songs[0]);
          base44.entities.Song.update(songs[0].id, { views: (songs[0].views || 0) + 1 }).catch(() => {});
          const recents = JSON.parse(localStorage.getItem('recents') || '[]');
          const entry = { id: songs[0].id, title: songs[0].title, artist_name: songs[0].artist_name, artist_slug: artistSlug, slug: songSlug };
          const filtered = recents.filter((r) => r.id !== entry.id);
          localStorage.setItem('recents', JSON.stringify([entry, ...filtered].slice(0, 20)));
          const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
          setIsFav(favs.some(f => f.id === songs[0].id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistSlug, songSlug]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const entry = { id: song.id, title: song.title, artist_name: song.artist_name, artist_slug: artistSlug, slug: songSlug };
    if (isFav) {
      localStorage.setItem('favorites', JSON.stringify(favorites.filter((f) => f.id !== song.id)));
      setIsFav(false);
    } else {
      localStorage.setItem('favorites', JSON.stringify([entry, ...favorites]));
      setIsFav(true);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-border border-t-orange-500 rounded-full animate-spin" />
      </div>
    );

  if (!song)
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8">
        <p className="text-muted-foreground">No se encontró la canción.</p>
        <Link to="/" className="mt-4 text-orange-500 hover:underline">Volver al inicio</Link>
      </div>
    );

  const isTransposed = view && view.startsWith('tono-');
  const transposeKey = isTransposed ? view.replace('tono-', '') : null;
  const activeView = view || (song.has_chords ? 'acordes' : 'tablatura');

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      {/* Header */}
      <div className="mb-4">
        <Link
          to={`/${artistSlug}`}
          className="inline-flex items-center text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {song.artist_name}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{displayTitle}</h1>
            <p className="text-muted-foreground mt-1 text-base">{song.artist_name}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-xl transition-colors ${isFav ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-500'}`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Spotify player arriba del contenido */}
      <div className="lg:hidden mb-6">
        <SpotifyPlayer song={song} />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        {/* Main content */}
        <div>
          <SongMeta song={song} />

          {/* Tabs */}
          {(song.has_chords || song.has_tablature) && (
            <div className="flex items-center gap-1 mb-6 border-b border-border">
              {song.has_chords && (
                <Link
                  to={`/${artistSlug}/${songSlug}/acordes`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeView === 'acordes' || isTransposed
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
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
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
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
          {activeView === 'tablatura' && song.has_tablature && <TablatureViewer song={song} />}
          {activeView === 'acordes' && !song.has_chords && song.has_tablature && <TablatureViewer song={song} />}

          {/* Botón Chat IA para seguir buscando */}
          <div className="mt-8 pt-6 border-t border-border">
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm bg-gradient-brand hover:opacity-90 transition-opacity shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Buscar Tablaturas con IA
            </button>
          </div>
        </div>

        {/* Right panel — Spotify (solo desktop) */}
        <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
          <SpotifyPlayer song={song} />
        </div>
      </div>
    </div>
  );
}