import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { ArrowLeft, Heart, Share2, Sparkles } from 'lucide-react';
import ChordViewer from '@/components/ChordViewer';
import TablatureViewer from '@/components/TablatureViewer';
import SongMeta from '@/components/SongMeta';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import SongSeoContent from '@/components/SongSeoContent';
import RelatedSongs from '@/components/RelatedSongs';
import { withResolvedSongContentFlags } from '@/lib/songContentFlags';

export default function SongPage() {
  const { artistSlug, songSlug, view } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  const displayTitle = song
    ? song.title.replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '').replace(/\s*\d+$/, '').trim()
    : '';

  const seoTitle = song?.seo_title || (song ? `${displayTitle} - ${song.artist_name} | Acordes y Tablatura | GuitarraIA` : 'Cargando canción...');
  const seoDescription = song?.seo_meta_description || (song ? `Acordes y tablatura de ${displayTitle} de ${song.artist_name}. Tonalidad: ${song.original_key || 'N/A'}. Aprende a tocarla en guitarra.` : '');

  const jsonLd = song ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MusicRecording',
        name: displayTitle,
        byArtist: { '@type': 'MusicGroup', name: song.artist_name },
        ...(song.original_key ? { musicalKey: song.original_key } : {}),
        ...(song.spotify_url ? { url: song.spotify_url } : {}),
      },
      ...(song.seo_faq?.length > 0 ? [{
        '@type': 'FAQPage',
        mainEntity: song.seo_faq.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }] : []),
    ],
  } : null;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical: `/${artistSlug}/${songSlug}`,
    jsonLd,
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
      <div className="flex items-center justify-center py-24 bg-g-page">
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#F97316' }} />
      </div>
    );

  if (!song)
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 bg-g-page">
        <p style={{ color: '#6B7280' }}>No se encontró la canción.</p>
        <Link to="/" className="mt-4" style={{ color: '#F97316' }}>Volver al inicio</Link>
      </div>
    );

  // Protect valid content immediately, even before the database repair runs.
  const resolvedSong = withResolvedSongContentFlags(song);
  const hasChords = resolvedSong.has_chords;
  const hasTablature = resolvedSong.has_tablature;

  const isTransposed = view && view.startsWith('tono-');
  const transposeKey = isTransposed ? view.replace('tono-', '') : null;
  const activeView = view || (hasChords ? 'acordes' : 'tablatura');

  return (
    <div className="song-page min-h-[100dvh] w-full max-w-full lg:pb-0 bg-g-page">
    <div className="main-content mobile-page-container py-6 min-w-0" style={{ boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="song-header mb-5">
        <Link to={`/${artistSlug}`}
          className="inline-flex items-center text-sm mb-4 transition-colors"
          style={{ color: '#6B7280' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {song.artist_name}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold break-words" style={{ color: '#1F2937' }}>{displayTitle}</h1>
            <p className="mt-1 text-base break-words" style={{ color: '#6B7280' }}>{song.artist_name}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={toggleFavorite}
              className="p-2 rounded-xl transition-colors"
              style={{ color: isFav ? '#F97316' : '#9CA3AF' }}>
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-xl transition-colors" style={{ color: '#9CA3AF' }}>
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile player */}
      <div className="lg:hidden mb-6">
        <SpotifyPlayer song={resolvedSong} />
      </div>

      <div className="song-layout grid gap-8">
        {/* Main content */}
        <div className="song-reading-column min-w-0">
          <SongMeta song={resolvedSong} />

          {/* Tabs */}
          {(hasChords || hasTablature) && (
            <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid #E5E7EB' }}>
              {hasChords && (
                <Link to={`/${artistSlug}/${songSlug}/acordes`}
                  className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                  style={activeView === 'acordes' || isTransposed
                    ? { borderColor: '#F97316', color: '#F97316' }
                    : { borderColor: 'transparent', color: '#6B7280' }}
                >
                  Acordes
                </Link>
              )}
              {hasTablature && (
                <Link to={`/${artistSlug}/${songSlug}/tablatura`}
                  className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                  style={activeView === 'tablatura'
                    ? { borderColor: '#F97316', color: '#F97316' }
                    : { borderColor: 'transparent', color: '#6B7280' }}
                >
                  Tablatura
                </Link>
              )}
            </div>
          )}

          {(activeView === 'acordes' || isTransposed) && hasChords && (
            <ChordViewer song={resolvedSong} transposeKey={transposeKey} />
          )}
          {activeView === 'tablatura' && hasTablature && <TablatureViewer song={resolvedSong} />}
          {activeView === 'acordes' && !hasChords && hasTablature && <TablatureViewer song={resolvedSong} />}

          <SongSeoContent song={resolvedSong} />
          <RelatedSongs song={resolvedSong} />

          <div className="hidden lg:block xl:hidden mt-8">
            <SpotifyPlayer song={song} />
          </div>

          {/* IA CTA + Donate */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
            <div className="song-actions">
              <button
                onClick={() => navigate('/chat')}
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)' }}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Preguntar a GuitarraIA</span>
              </button>
              <a
                href="https://paypal.me/schoolmarketing/1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#0070BA', color: '#fff' }}
              >
                <span>💙 Donar U$1</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right panel — Spotify (solo desktop) */}
        <div className="player-column hidden xl:block h-fit">
          <SpotifyPlayer song={song} />
        </div>
      </div>
    </div>
    </div>
  );
}