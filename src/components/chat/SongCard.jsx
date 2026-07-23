import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(128,185,64,0.15)', color: '#80B940' },
  'Intermedia': { bg: 'rgba(216,166,42,0.15)', color: '#D8A62A' },
  'Avanzada': { bg: 'rgba(217,90,50,0.15)', color: '#D95A32' },
};

function cleanTitle(title) {
  return (title || '')
    .replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '')
    .replace(/\s*\d+$/, '')
    .trim();
}

function getSpotifyEmbedUrl(raw) {
  if (!raw) return null;
  const match = raw.match(/track\/([A-Za-z0-9]+)/);
  if (match) return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`;
  return null;
}

export default function SongCard({ song }) {
  const displayTitle = cleanTitle(song.title);
  const diff = DIFF_COLORS[song.difficulty];
  const hasChords = song.has_chords;
  const hasTab = song.has_tablature;

  // Prefer a stored track id from Spotify sync (confirmed to exist).
  const storedTrackId = song.spotify_track_id || (song.spotify_embed || '').match(/track\/([A-Za-z0-9]+)/)?.[1] || null;
  const [embedUrl, setEmbedUrl] = useState(storedTrackId ? getSpotifyEmbedUrl(`track/${storedTrackId}`) : null);
  const [fetched, setFetched] = useState(false);

  // Always confirm the track exists via search so we never render a 404 player.
  useEffect(() => {
    if (fetched) return;
    // If sync already matched a track id, trust it and skip the lookup.
    if (storedTrackId) { setFetched(true); return; }
    setFetched(true);
    base44.functions.invoke('spotifySearch', {
      artist: song.artist_name,
      title: displayTitle,
    })
      .then(res => {
        const trackId = res?.data?.track_id;
        if (trackId) {
          setEmbedUrl(`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`);
        }
      })
      .catch(() => {});
  }, [song.id]);

  const actionLink = hasChords
    ? `/${song.artist_slug}/${song.slug}/acordes`
    : hasTab
    ? `/${song.artist_slug}/${song.slug}/tablatura`
    : `/${song.artist_slug}/${song.slug}`;

  const actionLabel = hasChords ? 'Ver acordes' : hasTab ? 'Ver tablatura' : 'Ver canción';

  return (
    <div className="song-card spotify-card" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
      {embedUrl ? (
        <div className="spotify-embed-wrapper">
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`Spotify: ${displayTitle}`}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-4 min-w-0" style={{ borderBottom: '1px solid #272C2F', minHeight: '72px' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)' }}>
            <Music className="w-4 h-4 text-white" />
          </div>
          <div className="song-card-info flex-1">
            <p className="song-card-title text-sm font-bold" style={{ color: '#F4F4F2' }}>{displayTitle}</p>
            <p className="song-card-artist text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
          </div>
        </div>
      )}

      <div className="song-card-content grid grid-cols-[110px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3">
        <div className="song-card-info col-span-2 sm:col-span-1">
          <p className="song-card-title text-sm font-semibold" style={{ color: '#F4F4F2' }}>{displayTitle}</p>
          <p className="song-card-artist text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
        </div>
        <div className="song-card-actions flex items-center gap-2 sm:col-auto sm:w-auto">
          {diff && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline" style={{ backgroundColor: diff.bg, color: diff.color }}>{song.difficulty}</span>}
          <Link to={actionLink} className="flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-80" style={{ backgroundColor: '#FF7200' }}>
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}