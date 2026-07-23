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
      <div className="flex items-center justify-center py-24" style={{ backgroundColor: '#0B0D0E' }}>
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#FF7200' }} />
      </div>
    );

  if (!song)
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4" style={{ backgroundColor: '#0B0D0E' }}>
        <p style={{ color: '#747B7F' }}>No se encontró la canción.</p>
        <Link to="/" className="mt-4" style={{ color: '#FF7200' }}>Volver al inicio</Link>
      </div>
    );

  const isTransposed = view && view.startsWith('tono-');
  const transposeKey = isTransposed ? view.replace('tono-', '') : null;
  const activeView = view || (song.has_chords ? 'acordes' : 'tablatura');

  return (
    <div className="song-page min-h-[100dvh] w-full max-w-full lg:pb-0" style={{ backgroundColor: '#0B0D0E' }}>
    <div className="mobile-page-container max-w-6xl py-6 min-w-0" style={{ boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="mb-5">
        <Link to={`/${artistSlug}`}
          className="inline-flex items-center text-sm mb-4 transition-colors"
          style={{ color: '#747B7F' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FF7200'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#747B7F'; }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {song.artist_name}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold break-words" style={{ color: '#F4F4F2' }}>{displayTitle}</h1>
            <p className="mt-1 text-base break-words" style={{ color: '#A7ACAE' }}>{song.artist_name}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={toggleFavorite}
              className="p-2 rounded-xl transition-colors"
              style={{ color: isFav ? '#FF7200' : '#747B7F' }}>
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-xl transition-colors" style={{ color: '#747B7F' }}>
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
            <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid #272C2F' }}>
              {song.has_chords && (
                <Link to={`/${artistSlug}/${songSlug}/acordes`}
                  className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                  style={activeView === 'acordes' || isTransposed
                    ? { borderColor: '#FF7200', color: '#FF7200' }
                    : { borderColor: 'transparent', color: '#747B7F' }}
                >
                  Acordes
                </Link>
              )}
              {song.has_tablature && (
                <Link to={`/${artistSlug}/${songSlug}/tablatura`}
                  className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                  style={activeView === 'tablatura'
                    ? { borderColor: '#FF7200', color: '#FF7200' }
                    : { borderColor: 'transparent', color: '#747B7F' }}
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

          <SongSeoContent song={song} />
          <RelatedSongs song={song} />

          {/* IA CTA + Donate */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #272C2F' }}>
            <div className="song-actions">
              <button
                onClick={() => navigate('/chat')}
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#FF7200' }}
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
        <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
          <SpotifyPlayer song={song} />
        </div>
      </div>
    </div>
    </div>
  );
}